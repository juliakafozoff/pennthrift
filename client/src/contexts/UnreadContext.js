import { createContext, useContext, useState } from 'react';

const UnreadContext = createContext({
    unreadCounts: [],
    setUnreadCounts: () => {},
});

export const UnreadProvider = ({ children }) => {
    const [unreadCounts, setUnreadCounts] = useState([]);
    
    return (
        <UnreadContext.Provider value={{ unreadCounts, setUnreadCounts }}>
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

