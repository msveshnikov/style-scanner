import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Container,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Button,
    useToast,
    Card,
    CardBody,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Badge,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
    SimpleGrid,
    Box,
    Spinner,
    Center,
    VStack,
    Heading,
    Select,
    HStack,
    Switch
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ArcElement,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { API_URL } from './App';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Admin = () => {
    const toast = useToast();
    const cancelRef = useRef();
    const [stats, setStats] = useState({ stats: {}, userGrowth: [], insightsStats: {} });
    const [users, setUsers] = useState([]);
    const [insights, setInsights] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState({ id: null, type: null });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const [dashboardRes, usersRes, insightsRes, feedbacksRes] = await Promise.all([
                fetch(`${API_URL}/api/admin/dashboard`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/admin/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/admin/insights`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/api/admin/feedbacks`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            const [dashboardData, usersData, insightsData, feedbacksData] = await Promise.all([
                dashboardRes.json(),
                usersRes.json(),
                insightsRes.json(),
                feedbacksRes.json()
            ]);
            setStats(dashboardData);
            setUsers(usersData);
            setInsights(insightsData);
            setFeedbacks(feedbacksData);
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to fetch data.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_URL}/api/admin/${itemToDelete.type}/${itemToDelete.id}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error();
            toast({
                title: 'Success',
                description: 'Item deleted successfully.',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
            fetchData();
        } catch {
            toast({
                title: 'Error',
                description: 'Failed to delete item.',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
        } finally {
            setIsLoading(false);
            setIsDeleteAlertOpen(false);
        }
    }, [itemToDelete, fetchData, toast]);

    const handleSubscriptionChange = useCallback(
        async (userId, newStatus) => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/admin/users/${userId}/subscription`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ subscriptionStatus: newStatus })
                });
                if (!response.ok) throw new Error();
                toast({
                    title: 'Success',
                    description: 'Subscription updated successfully.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                setUsers((prevUsers) =>
                    prevUsers.map((u) =>
                        u._id === userId ? { ...u, subscriptionStatus: newStatus } : u
                    )
                );
            } catch {
                toast({
                    title: 'Error',
                    description: 'Failed to update subscription.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
            } finally {
                setIsLoading(false);
            }
        },
        [toast]
    );

    const handlePrivacyChange = useCallback(
        async (insightId, newPrivacy) => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch(`${API_URL}/api/admin/insights/${insightId}/privacy`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ isPrivate: newPrivacy })
                });
                if (!response.ok) throw new Error();
                toast({
                    title: 'Success',
                    description: 'Insight privacy updated successfully.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true
                });
                setInsights((prevInsights) =>
                    prevInsights.map((p) =>
                        p._id === insightId ? { ...p, isPrivate: newPrivacy } : p
                    )
                );
            } catch {
                toast({
                    title: 'Error',
                    description: 'Failed to update insight privacy.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });
            } finally {
                setIsLoading(false);
            }
        },
        [toast]
    );

    const renderOverviewTab = useCallback(() => {
        const modelCounts = {};
        insights.forEach((p) => {
            const key = p.model || 'Unknown';
            modelCounts[key] = (modelCounts[key] || 0) + 1;
        });
        const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
        const pieData = {
            labels: Object.keys(modelCounts),
            datasets: [
                {
                    data: Object.values(modelCounts),
                    backgroundColor: colors.slice(0, Object.keys(modelCounts).length)
                }
            ]
        };
        return (
            <VStack spacing={8}>
                <StatGroup w="full">
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
                        {stats.stats &&
                            Object.entries(stats.stats).map(([key, value]) => (
                                <Card key={key}>
                                    <CardBody>
                                        <Stat>
                                            <StatLabel>
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </StatLabel>
                                            <StatNumber>
                                                {Array.isArray(value)
                                                    ? value.reduce(
                                                          (acc, curr) =>
                                                              acc + (Number(curr.count) || 0),
                                                          0
                                                      )
                                                    : key === 'conversionRate'
                                                      ? `${value}%`
                                                      : value}
                                            </StatNumber>
                                        </Stat>
                                    </CardBody>
                                </Card>
                            ))}
                    </SimpleGrid>
                </StatGroup>
                <Box w="full" h="400px" p={4}>
                    {stats.userGrowth?.length > 0 && (
                        <Line
                            data={{
                                labels: stats.userGrowth.map((d) => d._id),
                                datasets: [
                                    {
                                        label: 'User Growth',
                                        data: stats.userGrowth.map((d) => d.count),
                                        borderColor: '#FF5733',
                                        tension: 0.4
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top' } }
                            }}
                        />
                    )}
                </Box>
                {stats.insightsStats?.insightGrowth?.length > 0 && (
                    <Box w="full" h="400px" p={4}>
                        <Line
                            data={{
                                labels: stats.insightsStats.insightGrowth.map((d) => d._id),
                                datasets: [
                                    {
                                        label: 'Insight Growth',
                                        data: stats.insightsStats.insightGrowth.map((d) => d.count),
                                        borderColor: '#3498DB',
                                        tension: 0.4
                                    }
                                ]
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top' } }
                            }}
                        />
                    </Box>
                )}
                {Object.keys(modelCounts).length > 0 && (
                    <Box w="full" h="400px" p={4}>
                        <Pie
                            data={pieData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom' } }
                            }}
                        />
                    </Box>
                )}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
                    <Card>
                        <CardBody>
                            <Stat>
                                <StatLabel>Insights</StatLabel>
                                <StatNumber>{insights.length}</StatNumber>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </VStack>
        );
    }, [stats, insights]);

    if (isLoading && !users.length) {
        return (
            <Center h="100vh">
                <Spinner size="xl" color="blue.500" />
            </Center>
        );
    }

    return (
        <Container maxW="container.xl" py={8}>
            <HStack justify="space-between" mb={4}>
                <Heading>Admin Dashboard</Heading>
                <Button onClick={fetchData} isLoading={isLoading} colorScheme="blue">
                    Refresh
                </Button>
            </HStack>
            <Tabs isLazy index={selectedTab} onChange={setSelectedTab}>
                <TabList>
                    <Tab>Over</Tab>
                    <Tab>Usrs</Tab>
                    <Tab>Insights</Tab>
                    <Tab>Feed</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>{renderOverviewTab()}</TabPanel>
                    <TabPanel>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Email</Th>
                                    <Th>Subscription</Th>
                                    <Th>Joined</Th>
                                    <Th>Verified</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {users.map((user) => (
                                    <Tr key={user._id}>
                                        <Td>{user.email}</Td>
                                        <Td>
                                            <Select
                                                value={user.subscriptionStatus}
                                                size="sm"
                                                onChange={(e) =>
                                                    handleSubscriptionChange(
                                                        user._id,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="active">Active</option>
                                                <option value="free">Free</option>
                                                <option value="trialing">Trialing</option>
                                                <option value="past_due">Past Due</option>
                                                <option value="canceled">Canceled</option>
                                                <option value="incomplete_expired">
                                                    Incomplete Expired
                                                </option>
                                            </Select>
                                        </Td>
                                        <Td>{new Date(user.createdAt).toLocaleDateString()}</Td>
                                        <Td>{user.emailVerified ? 'Yes' : 'No'}</Td>
                                        <Td>
                                            <Button
                                                colorScheme="red"
                                                size="sm"
                                                leftIcon={<DeleteIcon />}
                                                onClick={() => {
                                                    setItemToDelete({
                                                        id: user._id,
                                                        type: 'users'
                                                    });
                                                    setIsDeleteAlertOpen(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TabPanel>
                    <TabPanel>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Title</Th>
                                    <Th>User</Th>
                                    <Th>Date</Th>
                                    <Th>Private</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {insights.map((insight) => (
                                    <Tr key={insight._id}>
                                        <Td>{insight.title}</Td>
                                        <Td>{insight.userId?.email || 'N/A'}</Td>
                                        <Td>{new Date(insight.createdAt).toLocaleString()}</Td>
                                        <Td>
                                            <Switch
                                                size="sm"
                                                colorScheme="blue"
                                                isChecked={insight.isPrivate}
                                                onChange={(e) =>
                                                    handlePrivacyChange(
                                                        insight._id,
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                        </Td>
                                        <Td>
                                            <Button
                                                colorScheme="red"
                                                size="sm"
                                                leftIcon={<DeleteIcon />}
                                                onClick={() => {
                                                    setItemToDelete({
                                                        id: insight._id,
                                                        type: 'insights'
                                                    });
                                                    setIsDeleteAlertOpen(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TabPanel>
                    <TabPanel>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>Email</Th>
                                    <Th>Type</Th>
                                    <Th>Message</Th>
                                    <Th>Date</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {feedbacks.map((feedback) => (
                                    <Tr key={feedback._id}>
                                        <Td>{feedback.userId?.email || 'N/A'}</Td>
                                        <Td>
                                            <Badge
                                                colorScheme={
                                                    feedback.type === 'bug'
                                                        ? 'red'
                                                        : feedback.type === 'feature'
                                                          ? 'blue'
                                                          : 'gray'
                                                }
                                            >
                                                {feedback.type}
                                            </Badge>
                                        </Td>
                                        <Td>{feedback.message}</Td>
                                        <Td>{new Date(feedback.createdAt).toLocaleString()}</Td>
                                        <Td>
                                            <Button
                                                colorScheme="red"
                                                size="sm"
                                                leftIcon={<DeleteIcon />}
                                                onClick={() => {
                                                    setItemToDelete({
                                                        id: feedback._id,
                                                        type: 'feedbacks'
                                                    });
                                                    setIsDeleteAlertOpen(true);
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </TabPanel>
                </TabPanels>
            </Tabs>
            <AlertDialog
                isOpen={isDeleteAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteAlertOpen(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>Delete Confirmation</AlertDialogHeader>
                        <AlertDialogBody>
                            Are you sure you want to delete this item?
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsDeleteAlertOpen(false)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDelete} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Container>
    );
};

export default Admin;
