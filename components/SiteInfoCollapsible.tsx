import React, { useState } from "react";
import {
  Flex,
  Box,
  Image,
  Heading,
  Text,
  Stack,
  Link,
  Icon,
  Collapse,
  HStack,
} from "@chakra-ui/react";
import { FaLink, FaChevronDown, FaChevronUp } from "react-icons/fa";

interface SiteInfoCollapsibleProps {
  siteInfo: any;
  onCopyLink: () => void;
}

const SiteInfoCollapsible: React.FC<SiteInfoCollapsibleProps> = ({ siteInfo, onCopyLink }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Box 
      as="button" 
      width="100%" 
      onClick={() => setIsExpanded(!isExpanded)}
      _hover={{ bg: "gray.50" }}
      transition="background 0.2s"
      p={2}
      borderRadius="md"
    >
      <Flex align="center" justify="space-between">
        <HStack spacing={4}>
          <Box
            borderRadius="full"
            boxSize="50px"
            overflow="hidden"
            flexShrink={0}
          >
            <Image
              src={`${siteInfo?.logoUrl}?${new Date().getTime()}`}
              alt="Logo"
              objectFit="cover"
              width="100%"
              height="100%"
              fallback={<Box bg="gray.200" w="100%" h="100%" borderRadius="full" />}
            />
          </Box>
          <Heading size="md">{siteInfo?.title}</Heading>
        </HStack>
        <Icon as={isExpanded ? FaChevronUp : FaChevronDown} />
      </Flex>

      <Collapse in={isExpanded} animateOpacity>
        <Box pt={4}>
          <Text color="gray.600" mb={2} dangerouslySetInnerHTML={{ __html: siteInfo?.description || '' }} />
          <Text color="gray.600" mb={4} dangerouslySetInnerHTML={{ __html: siteInfo?.description2 || '' }} />
          
          <Stack direction="row" spacing={2} justify="center">
            {siteInfo?.social?.map((social: any) => (
              <Link key={social.name} href={social.url} isExternal>
                <Flex
                  alignItems="center"
                  backgroundColor="#df7777"
                  borderRadius="full"
                  color="white"
                  height={8}
                  justifyContent="center"
                  width={8}
                >
                  <Image
                    alt={`${social.name} icon`}
                    src={`https://icongr.am/fontawesome/${social.name}.svg?size=20&color=ffffff`}
                  />
                </Flex>
              </Link>
            ))}
            <Flex
              as="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink();
              }}
              alignItems="center"
              backgroundColor="#df7777"
              borderRadius="full"
              color="white"
              height={8}
              justifyContent="center"
              width={8}
              cursor="pointer"
              _hover={{ opacity: 0.8 }}
              transition="opacity 0.2s"
            >
              <Icon as={FaLink} boxSize="20px" />
            </Flex>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default SiteInfoCollapsible; 