import { createContext, useContext, useState } from 'react';

const UnreadContext = createContext({
    unreadConversationIds: [],
    setUnreadConversationIds: () => {},
});

export const UnreadProvider = ({ children }) => {
    const [unreadConversationIds, setUnreadConversationIds] = useState([]);
    
    return (
        <UnreadContext.Provider value={{ unreadConversationIds, setUnreadConversationIds }}>
            {children}
        </UnreadContext.Provider>
    );
};

export const useUnread = () => {
    const context = useContext(UnreadContext);
    if (!context) {
        throw new Error('useUnread must be used within UnreadProvider');
    }
    return context;
};

