import { useState, useEffect } from 'react';
import {
    Box,
    Heading,
    Text,
    VStack,
    Image,
    SimpleGrid,
    Spinner,
    Center,
    useToast
} from '@chakra-ui/react';
import { API_URL } from './App';
import { useNavigate } from 'react-router-dom';

function Insights() {
    const [insightsData, setInsightsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const toast = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInsights = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const response = await fetch(`${API_URL}/api/myinsights`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        navigate('/login');
                        return;
                    }
                    const message = `Failed to fetch insights: ${response.status} ${response.statusText}`;
                    toast({
                        title: 'Error fetching insights',
                        description: message,
                        status: 'error',
                        duration: 5000,
                        isClosable: true
                    });
                    throw new Error(message);
                }
                const data = await response.json();
                setInsightsData(data);
            } catch (error) {
                console.error('Error fetching insights:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, [navigate, toast]);

    if (loading) {
        return (
            <Center py={6}>
                <Spinner size="xl" />
            </Center>
        );
    }

    if (!insightsData || insightsData.length === 0) {
        return (
            <Center py={6}>
                <Text fontSize="xl" textAlign="center">
                    No insights available yet. Scan your outfit to get personalized style advice.
                </Text>
            </Center>
        );
    }

    return (
        <Box p={6} maxW="1200px" mx="auto">
            <Heading mb={6} textAlign="center">
                My Style Insights
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {insightsData.map((insight) => (
                    <Box key={insight._id} borderWidth="1px" borderRadius="lg" overflow="hidden">
                        {insight.photo && (
                            <Image
                                src={"data:image/jpeg;base64,"+insight.photo}
                                alt="Outfit"
                                height="300px"
                                objectFit="cover"
                                width="100%"
                            />
                        )}
                        <Box p="6">
                            <VStack align="start" spacing={4}>
                                <Heading size="md">{insight.title || 'Style Insight'}</Heading>
                                {insight.analysis?.outfitAnalysis && (
                                    <Box>
                                        <Heading size="sm" mb={2}>
                                            Outfit Analysis
                                        </Heading>
                                        {insight.analysis.outfitAnalysis.overallStyle && (
                                            <Text fontSize="sm">
                                                Overall Style:{' '}
                                                {insight.analysis.outfitAnalysis.overallStyle}
                                            </Text>
                                        )}
                                        {insight.analysis.outfitAnalysis.fitAssessment && (
                                            <Text fontSize="sm">
                                                Fit Assessment:{' '}
                                                {insight.analysis.outfitAnalysis.fitAssessment}
                                            </Text>
                                        )}
                                        {insight.analysis.outfitAnalysis.colorPalette && (
                                            <Text fontSize="sm">
                                                Color Palette:{' '}
                                                {insight.analysis.outfitAnalysis.colorPalette.join(
                                                    ', '
                                                )}
                                            </Text>
                                        )}
                                    </Box>
                                )}
                                {insight.recommendations && (
                                    <Box>
                                        <Heading size="sm" mb={2}>
                                            Recommendations
                                        </Heading>
                                        {Array.isArray(insight.recommendations) ? (
                                            insight.recommendations.map((rec, index) => (
                                                <Text key={index} fontSize="sm">
                                                    • {rec}
                                                </Text>
                                            ))
                                        ) : (
                                            <Text fontSize="sm">{insight.recommendations}</Text>
                                        )}
                                    </Box>
                                )}
                                {insight.benefits && insight.benefits.length > 0 && (
                                    <Box>
                                        <Heading size="sm" mb={2}>
                                            Benefits
                                        </Heading>
                                        {insight.benefits.map((benefit, index) => (
                                            <Text key={index} fontSize="sm">
                                                • {benefit}
                                            </Text>
                                        ))}
                                    </Box>
                                )}
                            </VStack>
                        </Box>
                    </Box>
                ))}
            </SimpleGrid>
        </Box>
    );
}

export default Insights;
