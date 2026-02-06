import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from './components/Layout/AppLayout';
import { useWebSocket } from './hooks/useWebSocket';
import { useSettingsStore } from './store/settings-store';
import { settingsApi } from './services/api';

function App() {
  const { isConnected } = useWebSocket();
  const setFolders = useSettingsStore((state) => state.setFolders);
  const setLLMSettings = useSettingsStore((state) => state.setLLMSettings);

  useEffect(() => {
    const initData = async () => {
      try {
        const [folders, llmSettings] = await Promise.all([
          settingsApi.getFolders(),
          settingsApi.getLLMConfig()
        ]);
        setFolders(folders);
        setLLMSettings(llmSettings);
      } catch (error) {
        console.error('Failed to initialize app data:', error);
      }
    };

    initData();
  }, [setFolders, setLLMSettings]);

  return (
    <div className="h-screen bg-background">
      <AppLayout />
      {isConnected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 right-4 flex items-center gap-2 bg-success text-white px-3 py-1 rounded-full text-sm"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          연결됨
        </motion.div>
      )}
    </div>
  );
}

export default App;
