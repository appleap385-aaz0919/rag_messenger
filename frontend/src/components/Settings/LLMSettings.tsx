import { useState } from 'react';
import { settingsApi } from '../../services/api';
import { useSettingsStore } from '../../store/settings-store';

// Ollama 모델 목록
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

// Zhipu AI 모델 목록
const ZHIPU_MODELS = [
  { value: 'glm-4-plus', label: 'GLM-4 Plus (최고 성능)' },
  { value: 'glm-4-0520', label: 'GLM-4 0520' },
  { value: 'glm-4', label: 'GLM-4' },
  { value: 'glm-4-flash', label: 'GLM-4 Flash (빠른 응답)' },
  { value: 'glm-4-air', label: 'GLM-4 Air (저비용)' },
];

// OpenAI 모델 목록
const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o (최신)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (빠른 응답)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

// 공급자별 기본 설정
const PROVIDER_CONFIGS = {
  ollama: {
    label: 'Ollama (로컬)',
    baseUrl: 'http://localhost:11434',
    models: OLLAMA_MODELS,
    hasApiKey: false,
    customModel: true,
  },
  zhipu: {
    label: 'Zhipu AI (GLM-4)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: ZHIPU_MODELS,
    hasApiKey: true,
    customModel: false,
  },
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: OPENAI_MODELS,
    hasApiKey: true,
    customModel: false,
  },
};

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

  const handleProviderChange = (provider: 'ollama' | 'openai' | 'zhipu') => {
    const config = PROVIDER_CONFIGS[provider];
    setLocalSettings({
      ...localSettings,
      provider,
      baseUrl: config.baseUrl,
      model: typeof config.models[0] === 'string' ? config.models[0] : config.models[0].value,
    });
  };

  const currentConfig = PROVIDER_CONFIGS[localSettings.provider];
  const currentModels = currentConfig.models;

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          공급자
        </label>
        <select
          value={localSettings.provider}
          onChange={(e) => handleProviderChange(e.target.value as 'ollama' | 'openai' | 'zhipu')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ollama">Ollama (로컬)</option>
          <option value="zhipu">Zhipu AI (GLM-4)</option>
          <option value="openai">OpenAI</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          모델
        </label>
        {localSettings.provider === 'ollama' ? (
          <>
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
          </>
        ) : (
          <select
            value={localSettings.model}
            onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {currentModels.map((model) => (
              <option key={typeof model === 'string' ? model : model.value} value={typeof model === 'string' ? model : model.value}>
                {typeof model === 'string' ? model : model.label}
              </option>
            ))}
          </select>
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
          placeholder={currentConfig.baseUrl}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-gray-500 mt-1">
          {currentConfig.label} 기본 URL: {currentConfig.baseUrl}
        </p>
      </div>

      {currentConfig.hasApiKey && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API Key
          </label>
          <input
            type="password"
            value={localSettings.apiKey || ''}
            onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
            placeholder={localSettings.provider === 'zhipu' ? 'Zhipu AI API Key' : 'sk-...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {localSettings.provider === 'zhipu' && (
            <p className="text-xs text-gray-500 mt-1">
              API Key 발급: <a href="https://open.bigmodel.cn/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://open.bigmodel.cn/</a>
            </p>
          )}
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
