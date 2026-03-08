import { Box } from "../../styled-system/jsx";
import GraphStage from "@/components/GraphStage";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  return (
    <Box position="relative" h="100vh" w="100vw">
      <GraphStage />

      <Box
        position="absolute"
        inset="0"
        zIndex="10"
        display="flex"
        justifyContent="center"
        alignItems="flex-start"
        p="5"
        pointerEvents="none"
      >
        <Box
          pointerEvents="auto"
          w="100%"
          h="72px"
        >
          <SearchBar />
        </Box>
      </Box>
    </Box>
  );
}
