import { useState, useContext } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    Input,
    VStack,
    Heading,
    Text,
    useToast,
    Select,
    Container,
    Card,
    CardBody,
    SimpleGrid,
    Stack,
    Badge,
    Link
} from '@chakra-ui/react';
import { API_URL, UserContext } from './App';

const Profile = () => {
    const { user, setUser } = useContext(UserContext);
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (section, field, value) => {
        setUser((prev) => ({
            ...prev,
            [section]: { ...(prev[section] || {}), [field]: value }
        }));
    };

    const handleBasicChange = (field, value) => {
        setUser((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(API_URL + '/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    insightSettings: user?.insightSettings,
                    preferences: user?.preferences
                })
            });
            if (response.ok) {
                toast({
                    title: 'Success',
                    description: 'Profile updated successfully',
                    status: 'success',
                    duration: 3000
                });
            } else {
                toast({
                    title: 'Error',
                    description: 'Error updating profile',
                    status: 'error',
                    duration: 3000
                });
            }
        } catch {
            toast({
                title: 'Error',
                description: 'Error updating profile',
                status: 'error',
                duration: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxW="container.lg" py={8}>
            <Card>
                <CardBody>
                    <VStack spacing={8}>
                        <Box w="100%">
                            <Stack direction="row" justify="space-between" align="center" mb={4}>
                                <Text fontSize="xl">Subscription</Text>
                                <Badge
                                    colorScheme={
                                        user?.subscriptionStatus === 'active' ||
                                        user?.subscriptionStatus === 'trialing'
                                            ? 'green'
                                            : 'gray'
                                    }
                                >
                                    {user?.subscriptionStatus === 'active' ||
                                    user?.subscriptionStatus === 'trialing'
                                        ? 'Premium'
                                        : 'Free'}
                                </Badge>
                            </Stack>
                            {!(
                                user?.subscriptionStatus === 'active' ||
                                user?.subscriptionStatus === 'trialing'
                            ) ? (
                                <Link href="https://buy.stripe.com/00gdSPetHeEfgUg9AI" isExternal>
                                    <Button disabled={!user} colorScheme="orange">
                                        Upgrade to Premium ($7.99/mo)
                                    </Button>
                                </Link>
                            ) : (
                                <Link
                                    href={
                                        'https://billing.stripe.com/p/login/9AQ8zd8ZL79E51e000?prefilled_email=' +
                                        user?.email
                                    }
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <Button colorScheme="purple" mt={1} ml={1}>
                                        Customer Portal
                                    </Button>
                                </Link>
                            )}
                        </Box>
                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <VStack spacing={6} align="stretch">
                                <Heading size="md">Basic Information</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel>First Name</FormLabel>
                                        <Input
                                            value={user?.firstName || ''}
                                            onChange={(e) =>
                                                handleBasicChange('firstName', e.target.value)
                                            }
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Last Name</FormLabel>
                                        <Input
                                            value={user?.lastName || ''}
                                            onChange={(e) =>
                                                handleBasicChange('lastName', e.target.value)
                                            }
                                        />
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Email</FormLabel>
                                        <Input value={user?.email || ''} isReadOnly />
                                    </FormControl>
                                </SimpleGrid>
                            </VStack>
                            <VStack spacing={6} align="stretch" mt={8}>
                                <Heading size="md">Fashion AI Preferences</Heading>
                                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel>Preferred Style</FormLabel>
                                        <Select
                                            value={user?.preferences?.preferredStyle || ''}
                                            onChange={(e) =>
                                                handleChange(
                                                    'preferences',
                                                    'preferredStyle',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select style</option>
                                            <option value="Casual">Casual</option>
                                            <option value="Formal">Formal</option>
                                            <option value="Sporty">Sporty</option>
                                            <option value="Trendy">Trendy</option>
                                            <option value="Vintage">Vintage</option>
                                        </Select>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Fashion Mood</FormLabel>
                                        <Input
                                            value={user?.preferences?.fashionMood || ''}
                                            onChange={(e) =>
                                                handleChange(
                                                    'preferences',
                                                    'fashionMood',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Describe your current fashion mood"
                                        />
                                    </FormControl>
                                </SimpleGrid>
                            </VStack>
                            <VStack spacing={6} align="stretch" mt={8}>
                                <Heading size="md">Insight Settings</Heading>
                                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                    <FormControl>
                                        <FormLabel>Theme</FormLabel>
                                        <Select
                                            value={user?.insightSettings?.theme || ''}
                                            onChange={(e) =>
                                                handleChange(
                                                    'insightSettings',
                                                    'theme',
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="">Select theme</option>
                                            <option value="Light">Light</option>
                                            <option value="Dark">Dark</option>
                                            <option value="Auto">Auto</option>
                                            <option value="Primary Blue">Primary Blue</option>
                                            <option value="Secondary Blue">Secondary Blue</option>
                                            <option value="Vibrant Accent">Vibrant Accent</option>
                                            <option value="Olive Green">Olive Green</option>
                                            <option value="Sunset">Sunset</option>
                                        </Select>
                                    </FormControl>
                                </SimpleGrid>
                            </VStack>
                            <Box mt={8}>
                                <Button
                                    type="submit"
                                    colorScheme="primary"
                                    isLoading={isLoading}
                                    width="100%"
                                >
                                    Save
                                </Button>
                            </Box>
                        </form>
                    </VStack>
                </CardBody>
            </Card>
        </Container>
    );
};

export default Profile;
