import React from "react";
import {
  Box,
  Image,
  Heading,
  Text,
  Stack,
  Link,
  Flex,
  Center,
} from "@chakra-ui/react";

interface SiteInfoBannerProps {
  siteInfo: any;
}

const SiteInfoBanner: React.FC<SiteInfoBannerProps> = ({ siteInfo }) => {
  const logoUrl = React.useMemo(() => siteInfo?.logoUrl || '', [siteInfo?.logoUrl]);

  return (
    <Box width="100%" mb={8}>
      <Center flexDirection="column" p={4}>
        <Box
          borderRadius="full"
          boxSize="100px"
          overflow="hidden"
          mb={4}
        >
          <Image
            src={logoUrl}
            alt="Logo"
            objectFit="cover"
            width="100%"
            height="100%"
            loading="eager"
            fallback={<Box bg="gray.200" w="100%" h="100%" borderRadius="full" />}
          />
        </Box>
        
        <Heading size="xl" mb={4} textAlign="center">
          {siteInfo?.title}
        </Heading>
        
        <Text 
          color="gray.600" 
          mb={2} 
          textAlign="center"
          maxW="container.md"
          dangerouslySetInnerHTML={{ __html: siteInfo?.description || '' }} 
        />
        <Text 
          color="gray.600" 
          mb={6} 
          textAlign="center"
          maxW="container.md"
          dangerouslySetInnerHTML={{ __html: siteInfo?.description2 || '' }} 
        />
        
        <Stack direction="row" spacing={4} justify="center">
          {siteInfo?.social?.map((social: any) => (
            <Link key={social.name} href={social.url} isExternal>
              <Flex
                alignItems="center"
                backgroundColor="#df7777"
                borderRadius="full"
                color="white"
                height={10}
                justifyContent="center"
                width={10}
                _hover={{ opacity: 0.8 }}
                transition="opacity 0.2s"
              >
                <Image
                  alt={`${social.name} icon`}
                  src={`https://icongr.am/fontawesome/${social.name}.svg?size=24&color=ffffff`}
                />
              </Flex>
            </Link>
          ))}
        </Stack>
      </Center>
    </Box>
  );
};

export default SiteInfoBanner; 