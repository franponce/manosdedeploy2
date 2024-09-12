import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Input,
  Textarea,
  Button,
  Image,
  SimpleGrid,
  useToast,
  FormControl,
  FormLabel,
  Divider,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Switch,
  AspectRatio,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import imageCompression from "browser-image-compression";

import { INFORMATION } from "../app/constants";

interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  price: string | number;
}

const PRODUCT_LIMIT = 30;
const SYNC_INTERVAL = 30000; // 30 segundos

const AdminPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [siteInfo, setSiteInfo] = useState(INFORMATION);
  const [isMercadoPagoEnabled, setIsMercadoPagoEnabled] = useState(false);
  const [customScripts, setCustomScripts] = useState<string>("");
  const toast = useToast();
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
    const intervalId = setInterval(fetchProducts, SYNC_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchProducts]);

  useEffect(() => {
    const fetchMercadoPagoStatus = async () => {
      try {
        const response = await fetch("/api/mercadopago-status");
        if (!response.ok) throw new Error("Failed to fetch MercadoPago status");
        const data = await response.json();
        setIsMercadoPagoEnabled(data.enabled);
      } catch (error) {
        console.error("Error fetching MercadoPago status:", error);
        toast({
          title: "Error",
          description: "Failed to fetch MercadoPago status",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchMercadoPagoStatus();
  }, [toast]);

  useEffect(() => {
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = products.filter(
      (product) =>
        (product.title?.toLowerCase().includes(lowercasedTerm) ?? false) ||
        (product.description?.toLowerCase().includes(lowercasedTerm) ?? false) ||
        (product.price?.toString().includes(lowercasedTerm) ?? false)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSiteInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (name: string, value: string) => {
    setSiteInfo((prev) => ({
      ...prev,
      social: prev.social.map((s) => {
        if (s.name === name) {
          if (name === "whatsapp") {
            const phoneNumber = value.split("https://wa.me/")[1];
            return { ...s, url: `https://wa.me/${phoneNumber}` };
          }
          return { ...s, url: value };
        }
        return s;
      }),
    }));
  };

  const handleSiteImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "avatar") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const options = {
        maxSizeMB: 1,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      const base64 = await convertToBase64(compressedFile);
      
      setSiteInfo((prev) => ({ ...prev, [type]: base64 }));

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

  const handleSaveInfo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/update-site-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteInfo),
      });
      if (!response.ok) throw new Error("Failed to update site info");
      toast({
        title: "Éxito",
        description: "La información de la tienda se ha actualizado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating site info:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información de la tienda",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMercadoPago = async () => {
    try {
      const response = await fetch("/api/toggle-mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !isMercadoPagoEnabled }),
      });
      if (!response.ok) throw new Error("Failed to toggle MercadoPago");
      const data = await response.json();
      setIsMercadoPagoEnabled(data.enabled);
      toast({
        title: "Éxito",
        description: `MercadoPago ha sido ${data.enabled ? "activado" : "desactivado"}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error toggling MercadoPago:", error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado de MercadoPago",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleCreate = () => {
    if (products.length >= PRODUCT_LIMIT) {
      toast({
        title: "Límite alcanzado",
        description: `Has alcanzado el límite de ${PRODUCT_LIMIT} productos. Contacta con soporte para aumentar tu límite.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setCurrentProduct({ id: "", title: "", description: "", image: "", price: "" });
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setImagePreview(product.image);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
      try {
        const response = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete product");
        fetchProducts();
        toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado exitosamente.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({
          title: "Error",
          description: "Failed to delete product",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    try {
      const productToSave = { ...currentProduct, price: price };
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productToSave),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al guardar el producto");
      }
      fetchProducts();
      setIsModalOpen(false);
      setCurrentProduct(null);
      setImagePreview(null);
      toast({
        title: "Éxito",
        description: `Producto ${currentProduct.id ? "actualizado" : "creado"} exitosamente.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error desconocido al guardar el producto",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScriptsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomScripts(e.target.value);
  };

  const handleSaveScripts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/update-scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scripts: customScripts }),
      });
      if (!response.ok) throw new Error("Failed to update scripts");
      toast({
        title: "Éxito",
        description: "Los scripts personalizados se han actualizado correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating scripts:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los scripts personalizados",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const response = await fetch("/api/get-scripts");
        if (!response.ok) throw new Error("Failed to fetch scripts");
        const data = await response.json();
        setCustomScripts(data.scripts);
      } catch (error) {
        console.error("Error fetching scripts:", error);
      }
    };
    fetchScripts();
  }, []);

  return (
    <Box margin="auto" maxWidth="1200px" padding={8}>
      <Heading as="h1" mb={8} size="xl">
        Panel de administración
      </Heading>

      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h2" size="lg" mb={4}>
            Configuración de MercadoPago
          </Heading>
          <HStack>
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="mercadopago-switch" mb="0">
                {isMercadoPagoEnabled ? "Desactivar" : "Activar"} MercadoPago
              </FormLabel>
              <Switch
                id="mercadopago-switch"
                isChecked={isMercadoPagoEnabled}
                onChange={handleToggleMercadoPago}
              />
            </FormControl>
          </HStack>
        </Box>

        <Accordion allowMultiple>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Información de la tienda
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={6}>
                <FormControl>
                  <FormLabel>Título</FormLabel>
                  <Input
                    name="title"
                    value={siteInfo.title}
                    onChange={handleInfoChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descripción</FormLabel>
                  <Textarea
                    name="description"
                    value={siteInfo.description}
                    onChange={handleInfoChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Descripción adicional</FormLabel>
                  <Textarea
                    name="description2"
                    value={siteInfo.description2}
                    onChange={handleInfoChange}
                  />
                </FormControl>

                <Divider my={5} />

                <Heading as="h3" size="md">
                  Instagram + número para checkout WhatsApp
                </Heading>
                <FormControl>
                  <FormLabel>WhatsApp (carrito)</FormLabel>
                  <Input
                    name="whatsappCart"
                    value={siteInfo.whatsappCart}
                    onChange={handleInfoChange}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Instagram</FormLabel>
                  <Input
                    value={siteInfo.social.find((s) => s.name === "instagram")?.url || ""}
                    onChange={(e) => handleSocialChange("instagram", e.target.value)}
                  />
                </FormControl>

                <Divider my={5} />

                <Heading as="h3" size="md">
                  Imágenes (header + logo)
                </Heading>
                <FormControl>
                  <FormLabel>Banner (Recomendado: 1920x400 px)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSiteImageUpload(e, "banner")}
                  />
                </FormControl>
                {siteInfo.banner && (
                  <Image
                    src={siteInfo.banner}
                    alt="Banner preview"
                    maxHeight="200px"
                    objectFit="cover"
                  />
                )}

                <FormControl>
                  <FormLabel>Avatar (Recomendado: 400x400 px)</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleSiteImageUpload(e, "avatar")}
                  />
                </FormControl>
                {siteInfo.avatar && (
                  <Image
                    src={siteInfo.avatar}
                    alt="Avatar preview"
                    boxSize="100px"
                    objectFit="cover"
                  />
                )}

                <Button
                  colorScheme="blue"
                  isLoading={isLoading}
                  loadingText="Guardando"
                  onClick={handleSaveInfo}
                >
                  Guardar y actualizar info de la tienda
                </Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Gestión de productos
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Button colorScheme="green" mb={4} onClick={handleCreate}>
                Crear nuevo producto
              </Button>

              <Input
                mb={4}
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {products.length >= PRODUCT_LIMIT - 5 && products.length < PRODUCT_LIMIT && (
                <Text color="orange.500" mb={4}>
                  Te estás acercando al límite de productos. Tenés {PRODUCT_LIMIT - products.length} productos disponibles.
                </Text>
              )}

              {products.length >= PRODUCT_LIMIT && (
                <Text color="red.500" mb={4}>
                  Has alcanzado el límite de productos. Contacta con soporte para aumentar tu límite.
                </Text>
              )}

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredProducts.map((product) => (
                  <Box key={product.id} borderRadius="lg" borderWidth={1} overflow="hidden">
                    <AspectRatio ratio={1}>
                      <Image
                        src={product.image}
                        alt={product.title}
                        objectFit="cover"
                      />
                    </AspectRatio>
                    <Box p={4}>
                      <Heading as="h3" size="md" noOfLines={2} mb={2}>
                        {product.title}
                      </Heading>
                      <Text noOfLines={3} mb={2}>{product.description}</Text>
                      <Text fontWeight="bold" mb={4}>
                        ${Number(product.price).toFixed(2)}
                      </Text>
                      <HStack spacing={4}>
                        <Button colorScheme="blue" onClick={() => handleEdit(product)}>
                          Editar
                        </Button>
                        <Button colorScheme="red" onClick={() => handleDelete(product.id)}>
                          Eliminar
                        </Button>
                      </HStack>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading as="h2" size="lg">
                    Scripts personalizados
                  </Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={6}>
                <Text>
                  Añade aquí scripts personalizados que se ejecutarán en todas las páginas del sitio.
                  Tene cuidado al añadir scripts de terceros, ya que pueden afectar el rendimiento y la seguridad del sitio.
                </Text>
                <FormControl>
                  <FormLabel>Scripts</FormLabel>
                  <Textarea
                    value={customScripts}
                    onChange={handleScriptsChange}
                    placeholder="<script>// Tu código aquí</script>"
                    height="200px"
                  />
                </FormControl>
                <Button
                  colorScheme="blue"
                  isLoading={isLoading}
                  loadingText="Guardando"
                  onClick={handleSaveScripts}
                >
                  Guardar Scripts
                </Button>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {currentProduct?.id ? "Editar Producto" : "Crear nuevo producto"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
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
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminPage;