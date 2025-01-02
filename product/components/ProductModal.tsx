import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Image,
  useToast,
  Text,
  Box,
  Collapse,
  useDisclosure,
  useMediaQuery,
  Flex,
  Center,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Select,
  InputGroup,
  InputRightElement,
  HStack,
  Switch,
  IconButton,
  UnorderedList,
  ListItem,
  Spinner,
} from "@chakra-ui/react";
import { TimeIcon, AddIcon, CloseIcon } from "@chakra-ui/icons";
import imageCompression from "browser-image-compression";
import { Product, Category } from "../types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSiteInfo } from "@/hooks/useSiteInfo";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { CATEGORY_CONSTANTS } from '../../utils/constants';
import { useCategories } from '@/hooks/useCategories';
import { imageService } from '../../services/imageService';
import { useProduct } from '@/hooks/useProduct';
import { stockService } from '../../utils/firebase';
import { useStock } from '@/hooks/useStock';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => Promise<void>;
  product: Product | null;
  isLoading: boolean;
}

const MAX_IMAGES = 2;

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, product, isLoading: submitLoading }) => {
  const { product: currentProductData } = useProduct(product?.id || null);
  const { available: stockAvailable, isLoading: stockLoading } = useStock(product?.id || null);
  const [currentProduct, setCurrentProduct] = useState<Product>(() => ({
    id: '',
    title: '',
    description: '',
    price: 0,
    images: [],
    isVisible: true,
    stock: 0,
    categoryId: '',
    currency: 'ARS',
    order: '',
    isScheduled: false,
    scheduledPublishDate: null
  }));
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const toast = useToast();
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const { isOpen: isScheduleOpen, onToggle: toggleSchedule } = useDisclosure();
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const { siteInfo } = useSiteInfo();
  const [description, setDescription] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  const MAX_TITLE_LENGTH = 60;
  const MAX_DESCRIPTION_LENGTH = 300;
  const MAX_IMAGE_SIZE_MB = 5;
  const TARGET_WIDTH = 800;
  const TARGET_HEIGHT = 800;

  const { categories, isLoading: categoriesLoading, createCategory, mutate: mutateCategories } = useCategories();

  useEffect(() => {
    if (product) {
      setCurrentProduct({
        ...product,
        stock: stockAvailable
      });
    }
  }, [product, stockAvailable]);

  useEffect(() => {
    if (isOpen) {
      mutateCategories();
    }
  }, [isOpen, mutateCategories]);

  useEffect(() => {
    const fetchStock = async () => {
      if (product?.id) {
        try {
          const stockValue = await stockService.getProductStock(product.id);
          setCurrentProduct(prev => ({
            ...prev,
            stock: typeof stockValue === 'number' ? stockValue : 0
          }));
        } catch (error) {
          console.error('Error fetching stock:', error);
          setCurrentProduct(prev => ({
            ...prev,
            stock: prev.stock || 0
          }));
          
          toast({
            title: "Advertencia",
            description: "No se pudo cargar el stock actual del producto",
            status: "warning",
            duration: 3000,
          });
        }
      }
    };

    if (isOpen && product?.id) {
      fetchStock();
    }
  }, [isOpen, product?.id, toast]);

  useEffect(() => {
    if (isOpen) {
      setImagesToDelete([]);
    }
  }, [isOpen]);

  const handleProductImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (currentProduct.images.filter(Boolean).length >= MAX_IMAGES) {
      toast({
        title: "Límite alcanzado",
        description: "Solo se permiten hasta 2 imágenes por producto",
        status: "warning",
      });
      return;
    }

    try {
      setIsUploading(true);
      const imageUrl = await imageService.upload(file, currentProduct.id);
      
      setCurrentProduct(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen. Intenta nuevamente.",
        status: "error",
      });
    } finally {
      setIsUploading(false);
    }
  }, [currentProduct.id, currentProduct.images, toast]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'stock') {
      if (value === '' || /^\d+$/.test(value)) {
        const newStockValue = value === '' ? '' : parseInt(value, 10);
        
        setCurrentProduct(prev => ({
          ...prev,
          stock: newStockValue
        }));
      }
    } else {
      setCurrentProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      await Promise.all([
        onSubmit(currentProduct),
        new Promise(resolve => setTimeout(resolve, 1000))
      ]);
      
      for (const imageUrl of imagesToDelete) {
        try {
          await imageService.delete(imageUrl);
        } catch (error) {
          console.error('Error eliminando imagen:', error);
        }
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentProduct(prev => ({ ...prev, isVisible: e.target.checked }));
  };

  const handleDateChange = (date: Date | null) => {
    setScheduledDate(date);
    setCurrentProduct(prev => ({
      ...prev,
      scheduledPublishDate: date,
      isScheduled: date !== null,
    }));
  };

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean'],
    ],
  };

  const formats = [
    'bold', 'italic', 'underline', 'list', 'bullet'
  ];

  const handleDescriptionChange = (content: string) => {
    const textContent = content.replace(/<[^>]*>/g, '');
    if (textContent.length <= MAX_DESCRIPTION_LENGTH) {
      setDescription(content);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      if (categories.length >= CATEGORY_CONSTANTS.MAX_CATEGORIES) {
        toast({
          title: "Límite alcanzado",
          description: CATEGORY_CONSTANTS.ERROR_MESSAGES.LIMIT_REACHED,
          status: "info",
          duration: 3000,
        });
        return;
      }

      const newCategory = await createCategory(newCategoryName.trim());
      await mutateCategories();
      setCurrentProduct(prev => ({ ...prev, categoryId: newCategory.id }));
      setNewCategoryName("");
      setShowNewCategoryInput(false);
      
      toast({
        title: "¡Categoría creada! 🎉",
        description: "La nueva categoría se ha creado y seleccionado.",
        status: "success",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "No se pudo crear la categoría",
        description: error instanceof Error ? error.message : "Error desconocido",
        status: "warning",
        duration: 3000,
      });
    }
  };

  const formatScheduleInfo = () => {
    if (!scheduledDate) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires'
    };

    return new Intl.DateTimeFormat('es-AR', options).format(scheduledDate);
  };

  const normalizeImage = (img: string | string[]): string => {
    if (Array.isArray(img)) {
      return img[0];
    }
    return img;
  };

  const handleRemoveImage = (imageUrl: string) => {
    setImagesToDelete(prev => [...prev, imageUrl]);
    setCurrentProduct(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          {product ? 'Editar producto' : 'Nuevo producto'}
        </ModalHeader>
        <ModalCloseButton isDisabled={submitLoading} />
        <ModalBody overflowY="auto">
          {submitLoading ? (
            <Center py={8}>
              <VStack spacing={4}>
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                  size="xl"
                />
                <Text fontWeight="medium">
                  {product ? 'Actualizando producto...' : 'Creando producto...'}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Por favor, espere un momento
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Título</FormLabel>
                <Input
                  name="title"
                  value={currentProduct.title}
                  onChange={handleInputChange}
                  maxLength={MAX_TITLE_LENGTH}
                />
                <Text fontSize="sm" color="gray.500">
                  {`${currentProduct.title.length}/${MAX_TITLE_LENGTH}`}
                </Text>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Descripción</FormLabel>
                <ReactQuill
                  value={currentProduct.description || ''}
                  onChange={(content) => 
                    setCurrentProduct(prev => ({
                      ...prev,
                      description: content
                    }))
                  }
                  modules={modules}
                />
              </FormControl>

              <FormControl>
                <FormLabel>
                  Imágenes 
                  <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                    ({currentProduct.images.filter(Boolean).length}/{MAX_IMAGES})
                  </Text>
                </FormLabel>
                <Text fontSize="sm" color="gray.600" mb={3}>
                  Recomendaciones 😉:
                  <UnorderedList mt={1} spacing={1}>
                    <ListItem>Intenta que tu imagen sea cuadrada.</ListItem>
                    <ListItem>Las medidas recomendadas son de 800x800 px.</ListItem>
                    <ListItem>No debe pesar más de 5MB.</ListItem>
                  </UnorderedList>
                </Text>
                <VStack spacing={4} align="stretch">
                  {currentProduct.images.map((img, index) => (
                    <Flex key={index} align="center" gap={2}>
                      {img ? (
                        <>
                          <Image 
                            src={img} 
                            alt={`Imagen ${index + 1}`} 
                            boxSize="100px" 
                            objectFit="cover"
                            borderRadius="md" 
                          />
                          <IconButton
                            icon={<CloseIcon />}
                            aria-label="Eliminar imagen"
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleRemoveImage(img)}
                          />
                        </>
                      ) : null}
                    </Flex>
                  ))}
                  {currentProduct.images.filter(Boolean).length < MAX_IMAGES && (
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProductImageUpload(e, currentProduct.images.length)}
                    />
                  )}
                </VStack>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Precio</FormLabel>
                <NumberInput
                  value={Number(currentProduct.price) || 0}
                  min={0}
                  onChange={(_, value) => {
                    setCurrentProduct(prev => ({
                      ...prev,
                      price: Number(value) || 0
                    }));
                  }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Stock disponible
                </FormLabel>
                <NumberInput
                  value={currentProduct.stock ?? 0}
                  min={0}
                  precision={0}
                  onChange={(_, valueNumber) => {
                    setCurrentProduct(prev => ({
                      ...prev,
                      stock: valueNumber || 0
                    }));
                  }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Categoría</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <Select
                    name="categoryId"
                    value={currentProduct.categoryId}
                    onChange={handleInputChange}
                    isDisabled={categoriesLoading}
                  >
                    <option value="">Sin categoría</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>

                  {!showNewCategoryInput ? (
                    categories.length < CATEGORY_CONSTANTS.MAX_CATEGORIES && (
                      <Button
                        size="sm"
                        leftIcon={<AddIcon />}
                        variant="outline"
                        onClick={() => setShowNewCategoryInput(true)}
                      >
                        Crear nueva categoría
                      </Button>
                    )
                  ) : (
                    <Box>
                      <InputGroup size="md">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Nombre de la nueva categoría"
                          maxLength={CATEGORY_CONSTANTS.MAX_NAME_LENGTH}
                        />
                        <InputRightElement width="4.5rem">
                          <Text fontSize="xs" color="gray.500">
                            {newCategoryName.length}/{CATEGORY_CONSTANTS.MAX_NAME_LENGTH}
                          </Text>
                        </InputRightElement>
                      </InputGroup>
                      <HStack mt={2} spacing={2}>
                        <Button
                          size="sm"
                          colorScheme="purple"
                          onClick={handleCreateCategory}
                          isDisabled={!newCategoryName.trim()}
                        >
                          Crear y seleccionar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategoryName('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </HStack>
                    </Box>
                  )}
                </VStack>
              </FormControl>

              <Button
                leftIcon={<TimeIcon />}
                variant="outline"
                onClick={toggleSchedule}
                width="100%"
                justifyContent="flex-start"
              >
                {isScheduleOpen ? "Cancelar programación" : "Programar publicación"}
              </Button>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="isVisible" mb="0">
                  Visible en la tienda
                </FormLabel>
                <Switch
                  id="isVisible"
                  isChecked={currentProduct.isVisible}
                  onChange={handleVisibilityChange}
                />
              </FormControl>

              <Collapse in={isScheduleOpen} animateOpacity>
                <FormControl>
                  <Center mb={4}>
                    <VStack spacing={2}>
                      <Text fontWeight="bold">Fecha y hora de publicación</Text>
                      {scheduledDate && (
                        <Text fontSize="sm" color="blue.600">
                          Este producto se publicará automáticamente el {formatScheduleInfo()}
                        </Text>
                      )}
                    </VStack>
                  </Center>
                  <Box 
                    border="1px" 
                    borderColor="gray.200" 
                    borderRadius="md" 
                    p={2}
                    overflowX="auto"
                    maxWidth="100%"
                  >
                    <Flex 
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                      gap={4}
                      flexWrap="nowrap"
                    >
                      <Box flexShrink={0}>
                        <DatePicker
                          selected={scheduledDate}
                          onChange={handleDateChange}
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          inline
                        />
                      </Box>
                      <Box flexShrink={0}>
                        <DatePicker
                          selected={scheduledDate}
                          onChange={handleDateChange}
                          showTimeSelect
                          showTimeSelectOnly
                          timeIntervals={15}
                          timeCaption="Hora"
                          dateFormat="HH:mm"
                          inline
                        />
                      </Box>
                    </Flex>
                  </Box>
                </FormControl>
              </Collapse>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={submitLoading}
          >
            Cancelar
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={submitLoading}
            loadingText={
              <HStack spacing={2}>
                <Spinner size="sm" color="white" />
                <Text>{product ? 'Actualizando...' : 'Creando...'}</Text>
              </HStack>
            }
            type="submit"
          >
            {product ? 'Actualizar' : 'Crear'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductModal;