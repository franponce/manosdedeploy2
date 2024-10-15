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
  Textarea,
  Image,
  useToast,
  Text,
  Tooltip,
  InputGroup,
  InputRightAddon,
  Box
} from "@chakra-ui/react";
import { QuestionIcon } from "@chakra-ui/icons";
import imageCompression from "browser-image-compression";
import { Product } from "../types";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => Promise<void>;
  product: Product | null;
  isLoading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, product, isLoading }) => {
  const [currentProduct, setCurrentProduct] = useState<Product>({
    id: "",
    title: "",
    description: "",
    image: "",
    price: 0,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const toast = useToast();

  const MAX_TITLE_LENGTH = 60;
  const MAX_DESCRIPTION_LENGTH = 180;
  const MAX_IMAGE_SIZE_MB = 5;
  const TARGET_WIDTH = 800;
  const TARGET_HEIGHT = 800;

  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
      setImagePreview(product.image);
    } else {
      setCurrentProduct({
        id: "",
        title: "",
        description: "",
        image: "",
        price: 0,
      });
      setImagePreview(null);
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

    try {
      await onSubmit({...currentProduct, price});
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentProduct((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {currentProduct.id ? "Editar Producto" : "Crear nuevo producto"}
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
              <Textarea
                name="description"
                value={currentProduct.description}
                onChange={handleInputChange}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <Text fontSize="sm" color="gray.500">
                {`${currentProduct.description.length}/${MAX_DESCRIPTION_LENGTH}`}
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
              <FormLabel>
                Precio
                <Tooltip label="Ingrese el precio en pesos argentinos" fontSize="md">
                  <QuestionIcon boxSize={3} ml={1} color="gray.500" />
                </Tooltip>
              </FormLabel>
              <InputGroup>
                <Input
                  name="price"
                  type="number"
                  step="0.01"
                  value={currentProduct.price}
                  onChange={handleInputChange}
                />
                <InputRightAddon>
                  <Box mr={2}>🇦🇷</Box> ARS
                </InputRightAddon>
              </InputGroup>
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            {currentProduct.id ? "Actualizar" : "Crear"}
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
