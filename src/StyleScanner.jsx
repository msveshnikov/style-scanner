import {
    Box,
    FormControl,
    FormLabel,
    Input,
    Button,
    VStack,
    useToast,
    Text,
    Heading,
    Switch,
    Slider,
    SliderTrack,
    SliderFilledTrack,
    SliderThumb,
    SimpleGrid,
    Image,
    Collapse,
    List,
    ListItem,
    Badge
} from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { API_URL, UserContext } from './App';

function StyleScanner() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [analysisDepth, setAnalysisDepth] = useState(0.7);
    const [detailedAnalysis, setDetailedAnalysis] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [insights, setInsights] = useState(null);
    const toast = useToast();
    const { user } = useContext(UserContext);
    const [showOutfitAnalysisDetails, setShowOutfitAnalysisDetails] = useState(false);
    const [showRecommendationsDetails, setShowRecommendationsDetails] = useState(false);
    const [showBenefitsDetails, setShowBenefitsDetails] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setInsights(null);
        }
    };

    const handleDetailedAnalysisChange = (e) => {
        const wantsDetailed = e.target.checked;
        if (
            wantsDetailed &&
            !(user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'trialing')
        ) {
            toast({
                title: 'Subscription Required',
                description:
                    'Detailed Analysis is available for subscribers only. Subscribe to unlock this feature.',
                status: 'warning',
                duration: 5000,
                isClosable: true
            });
            return;
        }
        setDetailedAnalysis(wantsDetailed);
    };

    const convertToBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });

    const handleGenerateStyleInsights = async (e) => {
        e.preventDefault();
        if (!file) {
            toast({
                title: 'No Photo Selected',
                description: 'Please upload an outfit photo to scan your style.',
                status: 'error',
                duration: 5000,
                isClosable: true
            });
            return;
        }
        setScanning(true);
        setInsights(null);
        try {
            const base64Image = await convertToBase64(file);
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/api/generate-insight`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    imageSource: base64Image,
                    stylePreferences: detailedAnalysis ? 'Detailed analysis requested' : '',
                    model: 'gemini-2.0-flash-thinking-exp-01-21',
                    temperature: analysisDepth
                })
            });
            if (!response.ok) {
                let errorMessage = 'Failed to scan style';
                if (response.status === 403) {
                    errorMessage = 'Please login to scan your style.';
                } else {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                }
                throw new Error(errorMessage);
            }
            const result = await response.json();
            setInsights(result);
            toast({
                title: 'Scan Successful',
                description: 'Style insights generated!',
                status: 'success',
                duration: 5000,
                isClosable: true
            });
        } catch (error) {
            toast({
                title: 'Scan Failed',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        } finally {
            setScanning(false);
        }
    };

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <Heading as="h2" size="xl" textAlign={{ base: 'center', md: 'left' }} mb={6}>
                Style Scanner
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box as="form" onSubmit={handleGenerateStyleInsights}>
                    <VStack spacing={4} align="stretch">
                        <FormControl isRequired>
                            <FormLabel htmlFor="upload-photo">Outfit Photo</FormLabel>
                            <Input
                                id="upload-photo"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="analysis-depth">Analysis Depth</FormLabel>
                            <Slider
                                id="analysis-depth"
                                value={analysisDepth}
                                onChange={(val) => setAnalysisDepth(parseFloat(val))}
                                min={0}
                                max={1}
                                step={0.1}
                            >
                                <SliderTrack>
                                    <SliderFilledTrack />
                                </SliderTrack>
                                <SliderThumb />
                            </Slider>
                            <Text textAlign="center" fontSize="sm" color="gray.500">
                                Depth: {(analysisDepth * 100).toFixed(0)}%
                            </Text>
                        </FormControl>
                        <FormControl
                            display="flex"
                            alignItems="center"
                            justifyContent="space-between"
                        >
                            <FormLabel htmlFor="detailed-analysis" mb="0">
                                Detailed Analysis™{' '}
                                <Badge ml={1} colorScheme="blue" fontSize="0.7em">
                                    PRO
                                </Badge>
                            </FormLabel>
                            <Switch
                                id="detailed-analysis"
                                isChecked={detailedAnalysis}
                                onChange={handleDetailedAnalysisChange}
                            />
                        </FormControl>
                        <Button
                            mt={4}
                            colorScheme="blue"
                            size="lg"
                            w="full"
                            type="submit"
                            isLoading={scanning}
                            loadingText="Scanning..."
                        >
                            Get Style Insights
                        </Button>
                    </VStack>
                </Box>
                <Box>
                    {preview && (
                        <Box mb={4} borderRadius="md" overflow="hidden">
                            <Image
                                src={preview}
                                alt="Outfit Preview"
                                border="1px solid #ddd"
                                borderRadius="md"
                                maxH="400px"
                                objectFit="cover"
                            />
                        </Box>
                    )}
                    {!preview && !insights && (
                        <Box
                            borderWidth="1px"
                            borderRadius="md"
                            p={6}
                            textAlign="center"
                            bg="gray.50"
                        >
                            <Text fontSize="lg" color="gray.600">
                                Upload your outfit photo to get instant style insights.
                            </Text>
                        </Box>
                    )}

                    {insights && insights.outfitAnalysis && (
                        <Box
                            p={5}
                            borderWidth="1px"
                            borderRadius="lg"
                            mt={4}
                            bg="white"
                            boxShadow="sm"
                        >
                            <Heading size="md" mb={4} textAlign="center">
                                Outfit Analysis
                            </Heading>

                            {insights.outfitAnalysis.overallStyle && (
                                <Box mb={3}>
                                    <Text fontWeight="bold">Overall Style:</Text>
                                    <Text>{insights.outfitAnalysis.overallStyle}</Text>
                                </Box>
                            )}

                            {insights.outfitAnalysis.fitAssessment && (
                                <Box mb={3}>
                                    <Text fontWeight="bold">Fit Assessment:</Text>
                                    <Text>{insights.outfitAnalysis.fitAssessment}</Text>
                                </Box>
                            )}

                            {insights.outfitAnalysis.colorPalette &&
                                insights.outfitAnalysis.colorPalette.length > 0 && (
                                    <Box mb={3}>
                                        <Text fontWeight="bold">Color Palette:</Text>
                                        <Text>
                                            {insights.outfitAnalysis.colorPalette.join(', ')}
                                        </Text>
                                    </Box>
                                )}

                            {insights.outfitAnalysis.items &&
                                insights.outfitAnalysis.items.length > 0 && (
                                    <Box mb={3}>
                                        <Text
                                            fontWeight="bold"
                                            onClick={() =>
                                                setShowOutfitAnalysisDetails(
                                                    !showOutfitAnalysisDetails
                                                )
                                            }
                                            cursor="pointer"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="space-between"
                                        >
                                            Items Detected{' '}
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowOutfitAnalysisDetails(
                                                        !showOutfitAnalysisDetails
                                                    );
                                                }}
                                            >
                                                {showOutfitAnalysisDetails ? 'Hide' : 'Show'}
                                            </Button>
                                        </Text>
                                        <Collapse in={showOutfitAnalysisDetails}>
                                            <List spacing={2} mt={2}>
                                                {insights.outfitAnalysis.items.map(
                                                    (item, index) => (
                                                        <ListItem key={index} fontSize="sm">
                                                            <Text>
                                                                <Badge mr={2}>{item.type}</Badge>
                                                                {item.description}{' '}
                                                                {item.fit ? (
                                                                    <Badge
                                                                        ml={2}
                                                                        colorScheme="green"
                                                                    >
                                                                        Fit: {item.fit}
                                                                    </Badge>
                                                                ) : null}{' '}
                                                                {item.condition ? (
                                                                    <Badge
                                                                        ml={2}
                                                                        colorScheme="orange"
                                                                    >
                                                                        Condition: {item.condition}
                                                                    </Badge>
                                                                ) : null}
                                                            </Text>
                                                        </ListItem>
                                                    )
                                                )}
                                            </List>
                                        </Collapse>
                                    </Box>
                                )}
                        </Box>
                    )}

                    {insights && typeof insights.styleScore !== 'undefined' && (
                        <Box
                            p={5}
                            borderWidth="1px"
                            borderRadius="lg"
                            mt={4}
                            bg="white"
                            boxShadow="sm"
                        >
                            <Text fontSize="lg" fontWeight="bold" textAlign="center">
                                Style Score: {insights.styleScore} / 100
                            </Text>
                        </Box>
                    )}

                    {insights && insights.recommendations && (
                        <Box
                            p={5}
                            borderWidth="1px"
                            borderRadius="lg"
                            mt={4}
                            bg="white"
                            boxShadow="sm"
                        >
                            <Text
                                fontWeight="bold"
                                mb={4}
                                textAlign="center"
                                fontSize="md"
                                onClick={() =>
                                    setShowRecommendationsDetails(!showRecommendationsDetails)
                                }
                                cursor="pointer"
                                display="flex"
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                Recommendations{' '}
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRecommendationsDetails(!showRecommendationsDetails);
                                    }}
                                >
                                    {showRecommendationsDetails ? 'Hide' : 'Show'}
                                </Button>
                            </Text>
                            <Collapse in={showRecommendationsDetails}>
                                <List spacing={2}>
                                    {Array.isArray(insights.recommendations) ? (
                                        insights.recommendations.map((rec, index) => (
                                            <ListItem key={index} fontSize="sm">
                                                • {rec}
                                            </ListItem>
                                        ))
                                    ) : (
                                        <ListItem fontSize="sm">
                                            • {insights.recommendations}
                                        </ListItem>
                                    )}
                                </List>
                            </Collapse>
                        </Box>
                    )}

                    {insights &&
                        insights.benefits &&
                        Array.isArray(insights.benefits) &&
                        insights.benefits.length > 0 && (
                            <Box
                                p={5}
                                borderWidth="1px"
                                borderRadius="lg"
                                mt={4}
                                bg="white"
                                boxShadow="sm"
                            >
                                <Text
                                    fontWeight="bold"
                                    mb={4}
                                    textAlign="center"
                                    fontSize="md"
                                    onClick={() => setShowBenefitsDetails(!showBenefitsDetails)}
                                    cursor="pointer"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    Benefits{' '}
                                    <Button
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowBenefitsDetails(!showBenefitsDetails);
                                        }}
                                    >
                                        {showBenefitsDetails ? 'Hide' : 'Show'}
                                    </Button>
                                </Text>
                                <Collapse in={showBenefitsDetails}>
                                    <List spacing={2}>
                                        {insights.benefits.map((benefit, index) => (
                                            <ListItem key={index} fontSize="sm">
                                                • {benefit}
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                            </Box>
                        )}

                    {insights &&
                        !insights.outfitAnalysis &&
                        !insights.recommendations &&
                        !insights.benefits && (
                            <Box
                                p={6}
                                borderWidth="1px"
                                borderRadius="lg"
                                mt={4}
                                textAlign="center"
                            >
                                <Text fontSize="md">No insights available for this outfit.</Text>
                            </Box>
                        )}
                </Box>
            </SimpleGrid>
        </Box>
    );
}

export default StyleScanner;
