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
} from "@chakra-ui/react";
import imageCompression from "browser-image-compression";

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string | number;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  product: Product | null;
  isLoading: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSubmit, product, isLoading }) => {
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    setCurrentProduct(product);
    setImagePreview(product?.image || null);
  }, [product]);

  const handleProductImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const img = await createImageBitmap(file);
      const minDimension = 500;
      const maxDimension = 800;
      
      if (img.width < minDimension || img.height < minDimension || img.width > maxDimension || img.height > maxDimension) {
        toast({
          title: "Dimensiones incorrectas",
          description: `La imagen debe tener dimensiones entre ${minDimension}x${minDimension} y ${maxDimension}x${maxDimension} píxeles.`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: Math.max(img.width, img.height),
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const base64 = await convertToBase64(compressedFile);
      
      setImagePreview(base64);
      setCurrentProduct((prev) => prev ? { ...prev, image: base64 } : null);

      toast({
        title: "Imagen cargada",
        description: `La imagen se ha procesado y comprimido correctamente. Tamaño final: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`,
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

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const price = parseFloat(currentProduct.price as string);
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

    onSubmit({ ...currentProduct, price });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {currentProduct?.id ? "Editar Producto" : "Crear nuevo producto"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} as="form" onSubmit={handleSubmit}>
            <FormControl>
              <FormLabel>Título</FormLabel>
              <Input
                value={currentProduct?.title || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, title: e.target.value } : null
                  )
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Descripción</FormLabel>
              <Textarea
                value={currentProduct?.description || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, description: e.target.value } : null
                  )
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Precio</FormLabel>
              <Input
                type="number"
                step="0.01"
                value={currentProduct?.price || ""}
                onChange={(e) =>
                  setCurrentProduct((prev) =>
                    prev ? { ...prev, price: e.target.value } : null
                  )
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Imagen (Recomendado: 500x500 a 800x800 px, máx 1MB)</FormLabel>
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
                objectFit="cover"
              />
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit} isLoading={isLoading}>
            Guardar
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