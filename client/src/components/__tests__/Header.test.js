import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API module
const mockApiGet = jest.fn();
jest.mock('../../api/http', () => ({
    __esModule: true,
    default: {
        get: (url) => mockApiGet(url),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    }
}));

// Mock ProfileAPI
jest.mock('../../api/ProfileAPI', () => ({
    getUserProfile: jest.fn(() => Promise.resolve({ unread: [] })),
    path: 'http://localhost:4000'
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => {
    return jest.fn(() => ({
        on: jest.fn(),
        disconnect: jest.fn(),
    }));
});

// Mock logo image
jest.mock('../../assets/logo.png', () => 'logo.png');

const renderHeader = (initialEntries = ['/store']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>
                <Header />
            </AuthProvider>
        </MemoryRouter>
    );
};

describe('Header Logo Navigation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('navigates to /store when logo is clicked and user is authenticated', async () => {
        // Mock authenticated API response
        mockApiGet.mockImplementation((url) => {
            if (url === '/api/auth/me') {
                return Promise.resolve({
                    data: {
                        authenticated: true,
                        user: {
                            _id: '123',
                            username: 'testuser',
                            email: 'test@example.com'
                        }
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });

        const { container } = renderHeader(['/profile']);
        
        // Wait for AuthContext to load and Header to render
        await waitFor(() => {
            expect(screen.getByLabelText('PennThrift home')).toBeTruthy();
        });
        
        // Find the logo link
        const logoLink = container.querySelector('a[aria-label="PennThrift home"]');
        expect(logoLink).toBeTruthy();
        
        // Verify it points to /store when authenticated
        expect(logoLink.getAttribute('href')).toBe('/store');
    });

    it('navigates to / when logo is clicked and user is not authenticated', async () => {
        // Mock unauthenticated API response
        mockApiGet.mockImplementation((url) => {
            if (url === '/api/auth/me') {
                return Promise.resolve({
                    data: {
                        authenticated: false,
                        user: null
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });

        const { container } = renderHeader(['/login']);
        
        // Wait for AuthContext to load and Header to render
        await waitFor(() => {
            expect(screen.getByLabelText('PennThrift home')).toBeTruthy();
        });
        
        // Find the logo link
        const logoLink = container.querySelector('a[aria-label="PennThrift home"]');
        expect(logoLink).toBeTruthy();
        
        // Verify it points to / when not authenticated
        expect(logoLink.getAttribute('href')).toBe('/');
    });

    it('renders without crashing', async () => {
        mockApiGet.mockImplementation((url) => {
            if (url === '/api/auth/me') {
                return Promise.resolve({
                    data: {
                        authenticated: true,
                        user: {
                            _id: '123',
                            username: 'testuser'
                        }
                    }
                });
            }
            return Promise.resolve({ data: {} });
        });

        renderHeader(['/store']);
        await waitFor(() => {
            expect(screen.getByTestId('header')).toBeTruthy();
        });
    });
});

