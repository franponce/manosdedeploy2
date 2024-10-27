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
  Textarea,
  Select,
} from "@chakra-ui/react";
import { TimeIcon } from "@chakra-ui/icons";
import imageCompression from "browser-image-compression";
import { Product, Category } from "../types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSiteInfo } from "@/hooks/useSiteInfo";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { createCategory } from "../../utils/googleSheets";

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => Promise<void>;
  product: Product | null;
  isLoading: boolean;
  categories: Category[];
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, product, isLoading, categories }) => {
  const [currentProduct, setCurrentProduct] = useState<Product>({
    id: "",
    title: "",
    description: "",
    image: "",
    price: 0,
    currency: "ARS",
    isScheduled: false,
    scheduledPublishDate: null,
    categoryId: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const toast = useToast();
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const { isOpen: isScheduleOpen, onToggle: toggleSchedule } = useDisclosure();
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const { siteInfo } = useSiteInfo();
  const [description, setDescription] = useState('');
  const [newCategoryName, setNewCategoryName] = useState("");

  const MAX_TITLE_LENGTH = 60;
  const MAX_DESCRIPTION_LENGTH = 300;
  const MAX_IMAGE_SIZE_MB = 5;
  const TARGET_WIDTH = 800;
  const TARGET_HEIGHT = 800;

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setImagePreview(product.image);
      setDescription(product.description || '');
    } else {
      setCurrentProduct({
        id: "",
        title: "",
        description: "",
        image: "",
        price: 0,
        currency: "ARS",
        isScheduled: false,
        scheduledPublishDate: null,
        categoryId: "",
      });
      setImagePreview(null);
      setDescription('');
    }
  }, [product]);

  const handleProductImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await createImageBitmap(file);
      
      const options = {
        maxSizeMB: MAX_IMAGE_SIZE_MB,
        maxWidthOrHeight: Math.max(TARGET_WIDTH, TARGET_HEIGHT),
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Crear un canvas para redimensionar la imagen si es necesario
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calcular las nuevas dimensiones manteniendo la proporción
      let newWidth = img.width;
      let newHeight = img.height;
      if (newWidth > TARGET_WIDTH || newHeight > TARGET_HEIGHT) {
        const ratio = Math.min(TARGET_WIDTH / newWidth, TARGET_HEIGHT / newHeight);
        newWidth *= ratio;
        newHeight *= ratio;
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.7); // Ajusta la calidad si es necesario
      
      setImagePreview(base64);
      setCurrentProduct((prev) => ({ ...prev, image: base64 }));

      toast({
        title: "Imagen cargada",
        description: `La imagen se ha procesado y optimizado correctamente. Tamaño final: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const price = parseFloat(currentProduct.price.toString());
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un precio válido mayor que 0.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isScheduleOpen && !scheduledDate) {
      toast({
        title: "Error",
        description: "Por favor, seleccione una fecha y hora para la publicación programada.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const productToSubmit: Product = {
        ...currentProduct,
        description: description,
        price,
        isScheduled: isScheduleOpen,
        scheduledPublishDate: isScheduleOpen && scheduledDate ? scheduledDate : null,
      };

      await onSubmit(productToSubmit);
      onClose();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Por favor, intente de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
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
      const newCategory = await createCategory({ name: newCategoryName });
      setCurrentProduct({ ...currentProduct, categoryId: newCategory.id });
      setNewCategoryName("");
      toast({
        title: "Categoría creada",
        description: "La nueva categoría se ha creado y seleccionado.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent maxW={{ base: "95%", sm: "600px" }}>
        <ModalHeader>
          {currentProduct.id ? "Editar Producto" : "Crear Nuevo Producto"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} as="form" onSubmit={handleSubmit}>
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
            <FormControl>
              <FormLabel>Descripción</FormLabel>
              <Box border="1px" borderColor="gray.200" borderRadius="md">
                <ReactQuill
                  value={description}
                  onChange={handleDescriptionChange}
                  modules={modules}
                  formats={formats}
                />
              </Box>
              <Text fontSize="sm" color="gray.500" mt={1}>
                {`${description.replace(/<[^>]*>/g, '').length}/${MAX_DESCRIPTION_LENGTH}`}
              </Text>
            </FormControl>
            <FormControl>
              <FormLabel>Imagen</FormLabel>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Recomendaciones 😉:
                <br />
                • Intenta que tu imagen sea cuadrada.
                <br />
                • Las medidas recomendadas son de 800x800 px.
                <br />
                • No debe pesar más de 5MB.
              </Text>
              <Input
                type="file"
                accept="image/*"
                onChange={handleProductImageUpload}
              />
            </FormControl>
            {imagePreview && (
              <Image
                src={imagePreview}
                alt="Preview"
                maxHeight="200px"
                objectFit="contain"
              />
            )}
            <FormControl>
              <FormLabel>Precio ({siteInfo?.currency})</FormLabel>
              <Input
                name="price"
                type="number"
                step="0.01"
                value={currentProduct.price}
                onChange={handleInputChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Categoría</FormLabel>
              <Select
                name="categoryId"
                value={currentProduct.categoryId}
                onChange={handleInputChange}
              >
                <option value="">Sin categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Nueva categoría</FormLabel>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nombre de la nueva categoría"
              />
              <Button mt={2} onClick={handleCreateCategory}>
                Crear y seleccionar categoría
              </Button>
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
            <Collapse in={isScheduleOpen} animateOpacity>
              <FormControl>
                <Center mb={4}>
                  <Text fontWeight="bold">Fecha y hora de publicación</Text>
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
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme={isScheduleOpen ? "green" : "blue"}
            mr={3}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isScheduleOpen ? "Guardar y programar" : (currentProduct.id ? "Actualizar" : "Crear")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ProductModal;
