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
    Card,
    CardHeader,
    CardBody,
    Stack,
    Divider,
    Spinner,
    InputGroup
} from '@chakra-ui/react';
import { useContext, useRef, useState } from 'react';
import { API_URL, UserContext } from './App';
import { AiOutlineUpload } from 'react-icons/ai';

function StyleScanner() {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [analysisDepth, setAnalysisDepth] = useState(0.7);
    const [detailedAnalysis, setDetailedAnalysis] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [insights, setInsights] = useState(null);
    const toast = useToast();
    const { user } = useContext(UserContext);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setInsights(null); // Clear previous insights when new image is selected
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
                    'Detailed Analysis is available for subscribers only. Please subscribe to enable this feature.',
                status: 'warning',
                duration: 5000,
                isClosable: true
            });
            return;
        }
        setDetailedAnalysis(wantsDetailed);
    };

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
        setInsights(null); // Clear previous insights when scanning starts
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Image = reader.result.split(',')[1];
            const token = localStorage.getItem('token');
            try {
                const response = await fetch(`${API_URL}/api/generate-insight`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        imageSource: base64Image,
                        analysisDepth: analysisDepth,
                        stylePreferences: detailedAnalysis ? 'Detailed analysis requested' : ''
                    })
                });
                if (!response.ok) {
                    if (response.status === 403) {
                        throw new Error('Please login to scan your style');
                    }
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to scan style');
                }
                const result = await response.json();
                setInsights(result.insights);
            } catch (error) {
                toast({
                    title: 'Error',
                    description: error.message,
                    status: 'error',
                    duration: 5000,
                    isClosable: true
                });
            } finally {
                setScanning(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Card>
                    <CardHeader>
                        <Heading size="md">Upload Your Outfit</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Outfit Photo</FormLabel>
                                <InputGroup>
                                    <Button
                                        leftIcon={<AiOutlineUpload />}
                                        onClick={handleButtonClick}
                                        colorScheme="blue"
                                        variant="solid"
                                    >
                                        Upload Photo
                                    </Button>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        hidden
                                        ref={fileInputRef}
                                    />
                                </InputGroup>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Analysis Depth</FormLabel>
                                <Slider
                                    aria-label="analysis-depth"
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
                                    Detailed Analysis™
                                </FormLabel>
                                <Switch
                                    id="detailed-analysis"
                                    isChecked={detailedAnalysis}
                                    onChange={handleDetailedAnalysisChange}
                                    colorScheme="blue"
                                />
                            </FormControl>
                            <Button
                                colorScheme="primary"
                                size="lg"
                                w="full"
                                type="submit"
                                isLoading={scanning}
                                loadingText="Scanning..."
                                onClick={handleGenerateStyleInsights}
                            >
                                Scan Style
                            </Button>
                        </VStack>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <Heading size="md">Outfit Preview & Insights</Heading>
                    </CardHeader>
                    <CardBody>
                        <Stack spacing={4}>
                            {preview ? (
                                <Image
                                    src={preview}
                                    alt="Outfit Preview"
                                    borderRadius="md"
                                    maxH="350px"
                                    objectFit="cover"
                                    mb={2}
                                />
                            ) : (
                                <Box
                                    borderWidth="1px"
                                    borderRadius="md"
                                    p={4}
                                    textAlign="center"
                                    mb={2}
                                    borderColor="gray.200"
                                    bg="gray.50"
                                >
                                    <Text color="gray.500">No image selected</Text>
                                </Box>
                            )}

                            {scanning && (
                                <Box display="flex" justifyContent="center">
                                    <Spinner size="lg" color="blue.500" />
                                </Box>
                            )}

                            {insights && (
                                <Box>
                                    <Divider mb={4} />
                                    {insights.outfitAnalysis && (
                                        <Box mb={4}>
                                            <Heading size="sm" mb={2} textAlign="center">
                                                Outfit Analysis
                                            </Heading>
                                            {insights.outfitAnalysis.overallStyle && (
                                                <Text>
                                                    <Text fontWeight="bold">Overall Style:</Text>{' '}
                                                    {insights.outfitAnalysis.overallStyle}
                                                </Text>
                                            )}
                                            {insights.outfitAnalysis.fitAssessment && (
                                                <Text>
                                                    <Text fontWeight="bold">Fit Assessment:</Text>{' '}
                                                    {insights.outfitAnalysis.fitAssessment}
                                                </Text>
                                            )}
                                            {insights.outfitAnalysis.colorPalette && (
                                                <Text>
                                                    <Text fontWeight="bold">Color Palette:</Text>{' '}
                                                    {insights.outfitAnalysis.colorPalette.join(
                                                        ', '
                                                    )}
                                                </Text>
                                            )}
                                            {insights.outfitAnalysis.items &&
                                                insights.outfitAnalysis.items.length > 0 && (
                                                    <Box mt={2}>
                                                        <Text fontSize="sm" fontWeight="bold">
                                                            Items:
                                                        </Text>
                                                        <VStack align="start" spacing={1} mt={1}>
                                                            {insights.outfitAnalysis.items.map(
                                                                (item, index) => (
                                                                    <Text key={index} fontSize="xs">
                                                                        <Text
                                                                            as="span"
                                                                            fontWeight="medium"
                                                                        >
                                                                            {item.type}:
                                                                        </Text>{' '}
                                                                        {item.description}
                                                                        {item.fit ? (
                                                                            <Text as="span">
                                                                                .{' '}
                                                                                <Text
                                                                                    as="span"
                                                                                    fontWeight="medium"
                                                                                >
                                                                                    Fit:
                                                                                </Text>{' '}
                                                                                {item.fit}
                                                                            </Text>
                                                                        ) : null}
                                                                        {item.condition ? (
                                                                            <Text as="span">
                                                                                .{' '}
                                                                                <Text
                                                                                    as="span"
                                                                                    fontWeight="medium"
                                                                                >
                                                                                    Condition:
                                                                                </Text>{' '}
                                                                                {item.condition}
                                                                            </Text>
                                                                        ) : null}
                                                                    </Text>
                                                                )
                                                            )}
                                                        </VStack>
                                                    </Box>
                                                )}
                                        </Box>
                                    )}
                                    {typeof insights.styleScore !== 'undefined' && (
                                        <Box mb={4}>
                                            <Text fontSize="sm" fontWeight="bold">
                                                Style Score:
                                            </Text>
                                            <Text fontSize="md">{insights.styleScore}</Text>
                                        </Box>
                                    )}
                                    {insights.recommendations && (
                                        <Box mb={4}>
                                            <Text fontSize="sm" fontWeight="bold">
                                                Recommendations:
                                            </Text>
                                            {Array.isArray(insights.recommendations) ? (
                                                <VStack align="start" spacing={1} mt={2}>
                                                    {insights.recommendations.map((rec, index) => (
                                                        <Text key={index} fontSize="xs">
                                                            • {rec}
                                                        </Text>
                                                    ))}
                                                </VStack>
                                            ) : (
                                                <Text fontSize="sm">
                                                    {insights.recommendations}
                                                </Text>
                                            )}
                                        </Box>
                                    )}
                                    {insights.benefits &&
                                        Array.isArray(insights.benefits) &&
                                        insights.benefits.length > 0 && (
                                            <Box>
                                                <Text fontSize="sm" fontWeight="bold">
                                                    Benefits:
                                                </Text>
                                                <VStack align="start" spacing={1} mt={2}>
                                                    {insights.benefits.map((benefit, index) => (
                                                        <Text key={index} fontSize="xs">
                                                            • {benefit}
                                                        </Text>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        )}
                                    {!insights.outfitAnalysis &&
                                        !insights.recommendations &&
                                        !insights.benefits &&
                                        !scanning && (
                                            <Text fontSize="sm" color="gray.600">
                                                No insights available yet. Scan your outfit to see
                                                analysis.
                                            </Text>
                                        )}
                                </Box>
                            )}
                        </Stack>
                    </CardBody>
                </Card>
            </SimpleGrid>
        </Box>
    );
}

export default StyleScanner;
