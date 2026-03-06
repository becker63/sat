import { Box, HStack } from "../../styled-system/jsx";

export default function Home() {
  return (
    <HStack gap="4" p="10">
      <Box bg="blue.500" color="white" px="4" py="2" rounded="md">
        Hello Panda
      </Box>

      <Box borderWidth="1px" px="4" py="2" rounded="md">
        Second
      </Box>
    </HStack>
  );
}
