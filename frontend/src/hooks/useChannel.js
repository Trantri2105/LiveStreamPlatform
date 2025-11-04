import { useContext } from 'react';
import { ChannelContext } from '../context/ChannelContext';

const useChannel = () => {
    const context = useContext(ChannelContext);

    if (!context) {
        throw new Error('useChannel must be used within ChannelProvider');
    }

    return context;
};

export default useChannel;