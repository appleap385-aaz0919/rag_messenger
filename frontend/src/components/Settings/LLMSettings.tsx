import { useState } from 'react';
import { settingsApi } from '../../services/api';
import { useSettingsStore } from '../../store/settings-store';

// 자주 사용하는 Ollama 모델 목록
const OLLAMA_MODELS = [
  'llama3.2:latest',
  'llama3.1:latest',
  'llama3:latest',
  'gemma2:latest',
  'mistral:latest',
  'codellama:latest',
  'phi3:latest',
  'qwen2.5:latest',
  'glm4:latest',
];

export function LLMSettings() {
  const { llmSettings, setLLMSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(llmSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [customModel, setCustomModel] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateLLMConfig(localSettings);
      setLLMSettings(updated);
      alert('LLM 설정이 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 오류:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          공급자
        </label>
        <select
          value={localSettings.provider}
          onChange={(e) =>
            setLocalSettings({ ...localSettings, provider: e.target.value as 'ollama' | 'openai' })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ollama">Ollama (로컬)</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          모델
        </label>
        <select
          value={OLLAMA_MODELS.includes(localSettings.model) ? localSettings.model : 'custom'}
          onChange={(e) => {
            if (e.target.value === 'custom') {
              setCustomModel(localSettings.model);
            } else {
              setLocalSettings({ ...localSettings, model: e.target.value });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="" disabled>모델 선택</option>
          {OLLAMA_MODELS.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
          <option value="custom">직접 입력</option>
        </select>
        {(!OLLAMA_MODELS.includes(localSettings.model) || customModel) && (
          <input
            type="text"
            value={customModel || localSettings.model}
            onChange={(e) => {
              setCustomModel(e.target.value);
              setLocalSettings({ ...localSettings, model: e.target.value });
            }}
            placeholder="사용자 정의 모델 (예: glm4:latest)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mt-2"
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base URL
        </label>
        <input
          type="text"
          value={localSettings.baseUrl}
          onChange={(e) => setLocalSettings({ ...localSettings, baseUrl: e.target.value })}
          placeholder="http://localhost:11434"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {localSettings.provider === 'openai' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={localSettings.apiKey || ''}
            onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Temperature
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="2"
            value={localSettings.temperature}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Tokens
          </label>
          <input
            type="number"
            min="1"
            value={localSettings.maxTokens}
            onChange={(e) =>
              setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
