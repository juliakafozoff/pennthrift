import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNav from '../TopNav';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the API module
jest.mock('../../api/http', () => ({
    __esModule: true,
    default: {
        get: jest.fn(() => Promise.resolve({
            data: {
                authenticated: true,
                user: {
                    _id: '123',
                    username: 'testuser',
                    email: 'test@example.com'
                }
            }
        })),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    }
}));

const renderTopNav = (initialEntries = ['/store'], unreadCount = 0) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>
                <TopNav unreadCount={unreadCount} onLogout={() => {}} />
            </AuthProvider>
        </MemoryRouter>
    );
};

describe('TopNav Active State', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('applies inline backgroundColor style to active Store icon when on /store route', async () => {
        const { container } = renderTopNav(['/store']);
        
        // Wait for AuthContext to load
        await waitFor(() => {
            expect(screen.getByLabelText('Main navigation')).toBeTruthy();
        });
        
        // Find the Store/Market link (first nav item)
        const storeLink = container.querySelector('a[href="/store"]');
        expect(storeLink).toBeTruthy();
        
        // Check that inline style has backgroundColor set to var(--color-primary)
        // In jsdom, CSS variables are not computed, but we can check the inline style property
        expect(storeLink.style.backgroundColor).toBe('var(--color-primary)');
    });

    it('applies inline backgroundColor style to active Messages icon when on /profile/messages route', async () => {
        const { container } = renderTopNav(['/profile/messages']);
        
        // Wait for AuthContext to load
        await waitFor(() => {
            expect(screen.getByLabelText('Main navigation')).toBeTruthy();
        });
        
        // Find the Messages link
        const messagesLink = container.querySelector('a[href="/profile/messages"]');
        expect(messagesLink).toBeTruthy();
        
        // Check that inline style has backgroundColor set
        expect(messagesLink.style.backgroundColor).toBe('var(--color-primary)');
    });

    it('applies inline backgroundColor style to active Saved icon when on /profile/favourites route', async () => {
        const { container } = renderTopNav(['/profile/favourites']);
        
        // Wait for AuthContext to load
        await waitFor(() => {
            expect(screen.getByLabelText('Main navigation')).toBeTruthy();
        });
        
        // Find the Saved link
        const savedLink = container.querySelector('a[href="/profile/favourites"]');
        expect(savedLink).toBeTruthy();
        
        // Check that inline style has backgroundColor set
        expect(savedLink.style.backgroundColor).toBe('var(--color-primary)');
    });

    it('does NOT apply backgroundColor style to inactive icons', async () => {
        const { container } = renderTopNav(['/store']);
        
        // Wait for AuthContext to load
        await waitFor(() => {
            expect(screen.getByLabelText('Main navigation')).toBeTruthy();
        });
        
        // Find the Messages link (should be inactive)
        const messagesLink = container.querySelector('a[href="/profile/messages"]');
        expect(messagesLink).toBeTruthy();
        
        // Check that backgroundColor is NOT set (empty string)
        expect(messagesLink.style.backgroundColor).toBe('');
    });

    it('renders without crashing', async () => {
        renderTopNav(['/store']);
        await waitFor(() => {
            expect(screen.getByLabelText('Main navigation')).toBeTruthy();
        });
    });
});

