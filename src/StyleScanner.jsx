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
    Image
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

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
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

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <Box as="form" onSubmit={handleGenerateStyleInsights}>
                    <VStack spacing={4}>
                        <FormControl isRequired>
                            <FormLabel>Outfit Photo</FormLabel>
                            <Input type="file" accept="image/*" onChange={handleFileChange} />
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
                            <Text textAlign="center">
                                Depth: {(analysisDepth * 100).toFixed(0)}%
                            </Text>
                        </FormControl>
                        <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="detailed-analysis" mb="0">
                                Detailed Analysis™
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
                            Scan Style
                        </Button>
                    </VStack>
                </Box>
                <Box>
                    {preview ? (
                        <Image
                            src={preview}
                            alt="Outfit Preview"
                            borderRadius="md"
                            maxH="300px"
                            objectFit="cover"
                            mb={4}
                        />
                    ) : (
                        <Box borderWidth="1px" borderRadius="md" p={4} textAlign="center" mb={4}>
                            <Text>No image selected</Text>
                        </Box>
                    )}
                    {insights && (
                        <Box p={6} borderWidth="1px" borderRadius="lg">
                            {insights.outfitAnalysis && (
                                <Box mb={4}>
                                    <Heading size="md" mb={2} textAlign="center">
                                        Outfit Analysis
                                    </Heading>
                                    {insights.outfitAnalysis.overallStyle && (
                                        <Text>
                                            Overall Style: {insights.outfitAnalysis.overallStyle}
                                        </Text>
                                    )}
                                    {insights.outfitAnalysis.fitAssessment && (
                                        <Text>
                                            Fit Assessment: {insights.outfitAnalysis.fitAssessment}
                                        </Text>
                                    )}
                                    {insights.outfitAnalysis.colorPalette && (
                                        <Text>
                                            Color Palette:{' '}
                                            {insights.outfitAnalysis.colorPalette.join(', ')}
                                        </Text>
                                    )}
                                    {insights.outfitAnalysis.items &&
                                        insights.outfitAnalysis.items.length > 0 && (
                                            <Box mt={2}>
                                                <Text fontSize="md" fontWeight="bold">
                                                    Items:
                                                </Text>
                                                <VStack align="start" spacing={1} mt={1}>
                                                    {insights.outfitAnalysis.items.map(
                                                        (item, index) => (
                                                            <Text key={index} fontSize="sm">
                                                                {item.type}: {item.description}
                                                                {item.fit
                                                                    ? `. Fit: ${item.fit}`
                                                                    : ''}
                                                                {item.condition
                                                                    ? `. Condition: ${item.condition}`
                                                                    : ''}
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
                                    <Text fontSize="md" fontWeight="bold">
                                        Style Score:
                                    </Text>
                                    <Text fontSize="md">{insights.styleScore}</Text>
                                </Box>
                            )}
                            {insights.recommendations && (
                                <Box mb={4}>
                                    <Text fontSize="md" fontWeight="bold">
                                        Recommendations:
                                    </Text>
                                    {Array.isArray(insights.recommendations) ? (
                                        <VStack align="start" spacing={2} mt={2}>
                                            {insights.recommendations.map((rec, index) => (
                                                <Text key={index} fontSize="sm">
                                                    • {rec}
                                                </Text>
                                            ))}
                                        </VStack>
                                    ) : (
                                        <Text fontSize="md">{insights.recommendations}</Text>
                                    )}
                                </Box>
                            )}
                            {insights.benefits &&
                                Array.isArray(insights.benefits) &&
                                insights.benefits.length > 0 && (
                                    <Box>
                                        <Text fontSize="md" fontWeight="bold">
                                            Benefits:
                                        </Text>
                                        <VStack align="start" spacing={2} mt={2}>
                                            {insights.benefits.map((benefit, index) => (
                                                <Text key={index} fontSize="sm">
                                                    • {benefit}
                                                </Text>
                                            ))}
                                        </VStack>
                                    </Box>
                                )}
                            {!insights.outfitAnalysis &&
                                !insights.recommendations &&
                                !insights.benefits && (
                                    <Text fontSize="md">No insights available.</Text>
                                )}
                        </Box>
                    )}
                </Box>
            </SimpleGrid>
        </Box>
    );
}

export default StyleScanner;
