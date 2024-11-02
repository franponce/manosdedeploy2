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
  InputGroup,
  InputRightElement,
  HStack,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { TimeIcon, AddIcon } from "@chakra-ui/icons";
import imageCompression from "browser-image-compression";
import { Product, Category } from "../types";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useSiteInfo } from "@/hooks/useSiteInfo";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import { createCategory } from "../../utils/googleSheets";
import { CATEGORY_CONSTANTS } from '../../utils/constants';
import { useCategories } from '../../hooks/useCategories';

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
  const [formData, setFormData] = useState<Product>({
    id: '',
    title: '',
    description: '',
    image: '',
    price: 0,
    currency: 'ARS',
    categoryId: '',
    isScheduled: false,
    scheduledPublishDate: null,
    stock: 0
  });

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        scheduledPublishDate: product.scheduledPublishDate ? new Date(product.scheduledPublishDate) : null,
        stock: product.stock || 0
      });
      setImagePreview(product.image);
      setDescription(product.description || '');
    } else {
      setFormData({
        id: '',
        title: '',
        description: '',
        image: '',
        price: 0,
        currency: 'ARS',
        isScheduled: false,
        scheduledPublishDate: null,
        categoryId: '',
        stock: 0
      });
      setImagePreview(null);
      setDescription('');
    }
  }, [product]);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const toast = useToast();
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const { isOpen: isScheduleOpen, onToggle: toggleSchedule } = useDisclosure();
  const [isMobile] = useMediaQuery("(max-width: 48em)");
  const { siteInfo } = useSiteInfo();
  const [description, setDescription] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const { createCategory } = useCategories();

  const MAX_TITLE_LENGTH = 60;
  const MAX_DESCRIPTION_LENGTH = 300;
  const MAX_IMAGE_SIZE_MB = 5;
  const TARGET_WIDTH = 800;
  const TARGET_HEIGHT = 800;

  const handleProductImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast({
        title: "Error",
        description: `La imagen no debe superar los ${MAX_IMAGE_SIZE_MB}MB`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (newWidth > TARGET_WIDTH || newHeight > TARGET_HEIGHT) {
        const ratio = Math.min(TARGET_WIDTH / newWidth, TARGET_HEIGHT / newHeight);
        newWidth = Math.floor(newWidth * ratio);
        newHeight = Math.floor(newHeight * ratio);
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx?.drawImage(img, 0, 0, newWidth, newHeight);
      
      let quality = 0.8;
      let base64 = canvas.toDataURL('image/jpeg', quality);
      
      while (base64.length > 45000 && quality > 0.1) {
        quality -= 0.1;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }

      if (base64.length > 45000) {
        throw new Error('La imagen es demasiado grande incluso después de la compresión');
      }

      setImagePreview(base64);
      setFormData(prev => ({ ...prev, image: base64 }));

      toast({
        title: "Imagen cargada",
        description: `Imagen procesada correctamente (${(base64.length / 1024).toFixed(2)}KB)`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error processing image:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen. Intenta con una imagen más pequeña o de menor calidad.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const price = parseFloat(formData.price.toString());
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Error",
        description: "Por favor, ingrese un precio válido mayor que 0",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (isScheduleOpen && !scheduledDate) {
      toast({
        title: "Error",
        description: "Por favor, seleccione una fecha y hora para la publicación programada",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const productToSubmit: Product = {
        ...formData,
        description: description,
        price,
        isScheduled: isScheduleOpen,
        scheduledPublishDate: isScheduleOpen && scheduledDate ? scheduledDate : null,
      };

      await onSubmit(productToSubmit);
      toast({
        title: "Producto guardado",
        description: isScheduleOpen ? `Producto programado para ${scheduledDate?.toLocaleString()}` : "Producto guardado exitosamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error("Error al guardar el producto:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Por favor, intenta nuevamente.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setScheduledDate(date);
    setFormData(prev => ({
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
      setFormData(prev => ({ ...prev, categoryId: newCategory.id }));
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent maxW={{ base: "95%", sm: "600px" }}>
        <ModalHeader>
          {product ? 'Editar Producto' : 'Crear Nuevo Producto'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {/* ... otros campos del formulario ... */}
            
            <FormControl>
              <FormLabel>Stock disponible</FormLabel>
              <NumberInput
                min={0}
                value={formData.stock}
                onChange={(valueString) => {
                  const value = parseInt(valueString) || 0;
                  setFormData(prev => ({ ...prev, stock: value }));
                }}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme={isScheduleOpen ? "green" : "blue"}
            mr={3}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            {isScheduleOpen ? "Guardar y programar" : (product ? "Actualizar" : "Crear")}
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