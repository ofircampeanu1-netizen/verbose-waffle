import React, { useState, useEffect } from 'react';
import { Clock, Plus, Play, Square, Settings, X, Save } from 'lucide-react';

export default function Tasker() {
  const [tasks, setTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showSettings, setShowSettings] = useState(false);
  const [storyPointConfig, setStoryPointConfig] = useState([
    { points: 1, minHours: 0, maxHours: 4 },
    { points: 2, minHours: 4, maxHours: 8 },
    { points: 3, minHours: 8, maxHours: 12 },
    { points: 5, minHours: 12, maxHours: 16 },
    { points: 8, minHours: 16, maxHours: 24 },
    { points: 13, minHours: 24, maxHours: 999 }
  ]);

  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // Load data from storage
  useEffect(() => {
    const tasksResult = localStorage.getItem("tasks");
    const configResult = localStorage.getItem("storyPointConfig");

    if (tasksResult) {
      setTasks(JSON.parse(tasksResult));
    }

    if (configResult) {
      setStoryPointConfig(JSON.parse(configResult));
    }
    setHasLoadedFromStorage(true);
  }, []);

  // Save data to storage whenever it changes
  useEffect(() => {
    if (!hasLoadedFromStorage) return;

    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("storyPointConfig", JSON.stringify(storyPointConfig));
  }, [tasks, storyPointConfig, hasLoadedFromStorage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    
    const newTask = {
      id: Date.now(),
      name: newTaskName,
      logs: [],
      totalTime: 0
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  const startTask = (taskId) => {
    const now = Date.now();
    
    if (activeTaskId !== null) {
      setTasks(prev => prev.map(task => {
        if (task.id === activeTaskId) {
          const activeLog = task.logs[task.logs.length - 1];
          if (activeLog && !activeLog.endTime) {
            const duration = now - activeLog.startTime;
            return {
              ...task,
              logs: [
                ...task.logs.slice(0, -1),
                { ...activeLog, endTime: now }
              ],
              totalTime: task.totalTime + duration
            };
          }
        }
        return task;
      }));
    }
    
    if (taskId !== activeTaskId) {
      setTasks(prev => prev.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            logs: [...task.logs, { startTime: now, endTime: null }]
          };
        }
        return task;
      }));
      setActiveTaskId(taskId);
    } else {
      setActiveTaskId(null);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getTaskCurrentTime = (task) => {
    let total = task.totalTime;
    const activeLog = task.logs[task.logs.length - 1];
    if (activeLog && !activeLog.endTime && task.id === activeTaskId) {
      total += currentTime - activeLog.startTime;
    }
    return total;
  };

  const calculateStoryPoints = (ms) => {
    const hours = ms / (1000 * 60 * 60);
    const sorted = [...storyPointConfig].sort((a, b) => a.minHours - b.minHours);
    
    for (let config of sorted) {
      if (hours >= config.minHours && hours < config.maxHours) {
        return config.points;
      }
    }
    return sorted[sorted.length - 1].points;
  };

  const formatLogTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const updateStoryPointConfig = (index, field, value) => {
    const newConfig = [...storyPointConfig];
    newConfig[index][field] = parseFloat(value) || 0;
    setStoryPointConfig(newConfig);
  };

  const addStoryPointTier = () => {
    const lastTier = storyPointConfig[storyPointConfig.length - 1];
    setStoryPointConfig([...storyPointConfig, {
      points: lastTier.points + 1,
      minHours: lastTier.maxHours,
      maxHours: lastTier.maxHours + 8
    }]);
  };

  const removeStoryPointTier = (index) => {
    if (storyPointConfig.length > 1) {
      setStoryPointConfig(storyPointConfig.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8" style={{ color: '#236192' }} />
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#4B4F54' }}>Tasker</h1>
                <p className="text-gray-600">D&A Time and Story Point Task Tracker</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6" style={{ color: '#4B4F54' }} />
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold" style={{ color: '#4B4F54' }}>Story Point Configuration</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6">
                  Configure how hours translate to story points. Each tier defines a range of hours.
                </p>
                
                <div className="space-y-4">
                  {storyPointConfig.sort((a, b) => a.minHours - b.minHours).map((config, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: '#4B4F54' }}>
                            Story Points
                          </label>
                          <input
                            type="number"
                            value={config.points}
                            onChange={(e) => updateStoryPointConfig(index, 'points', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                            style={{ focusRingColor: '#236192' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: '#4B4F54' }}>
                            Min Hours
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={config.minHours}
                            onChange={(e) => updateStoryPointConfig(index, 'minHours', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                            style={{ focusRingColor: '#236192' }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1" style={{ color: '#4B4F54' }}>
                            Max Hours
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={config.maxHours}
                            onChange={(e) => updateStoryPointConfig(index, 'maxHours', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                            style={{ focusRingColor: '#236192' }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeStoryPointTier(index)}
                        disabled={storyPointConfig.length === 1}
                        className="p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: '#C10016' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={addStoryPointTier}
                    className="flex-1 px-4 py-2 border-2 rounded-lg font-medium flex items-center justify-center gap-2"
                    style={{ borderColor: '#00B5E2', color: '#00B5E2' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0f7ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Plus className="w-5 h-5" />
                    Add Tier
                  </button>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#74AA50' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5d8a40'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#74AA50'}
                  >
                    <Save className="w-5 h-5" />
                    Save & Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Task Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={addTask} className="flex gap-3">
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="Enter task name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
              style={{ focusRingColor: '#236192' }}
            />
            <button
              type="submit"
              className="px-6 py-2 text-white rounded-lg flex items-center gap-2 font-medium"
              style={{ backgroundColor: '#C10016' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#9a0011'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C10016'}
            >
              <Plus className="w-5 h-5" />
              Add Task
            </button>
          </form>
        </div>

        {/* Active Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#4B4F54' }}>Active Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks yet. Add a task to start tracking time.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const isActive = task.id === activeTaskId;
                const currentTaskTime = getTaskCurrentTime(task);
                const storyPoints = calculateStoryPoints(currentTaskTime);
                
                return (
                  <div
                    key={task.id}
                    onClick={() => startTask(task.id)}
                    className="p-4 rounded-lg border-2 cursor-pointer transition-all"
                    style={{
                      borderColor: isActive ? '#236192' : '#e5e7eb',
                      backgroundColor: isActive ? '#eff6ff' : 'white'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isActive ? (
                          <Square className="w-5 h-5 fill-current" style={{ color: '#236192' }} />
                        ) : (
                          <Play className="w-5 h-5 text-gray-400" />
                        )}
                        <span className="font-medium" style={{ color: '#4B4F54' }}>{task.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-mono font-semibold" style={{ color: isActive ? '#236192' : '#4B4F54' }}>
                          {formatTime(currentTaskTime)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium" style={{ color: '#00B5E2' }}>
                            {storyPoints} SP
                          </span>
                          {isActive && (
                            <span className="text-xs font-medium" style={{ color: '#74AA50' }}>RUNNING</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#4B4F54' }}>Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#eff6ff' }}>
                <div className="text-sm text-gray-600 mb-1">Total Time</div>
                <div className="text-2xl font-bold" style={{ color: '#236192' }}>
                  {formatTime(tasks.reduce((sum, task) => sum + getTaskCurrentTime(task), 0))}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#e0f7ff' }}>
                <div className="text-sm text-gray-600 mb-1">Total Story Points</div>
                <div className="text-2xl font-bold" style={{ color: '#00B5E2' }}>
                  {tasks.reduce((sum, task) => sum + calculateStoryPoints(getTaskCurrentTime(task)), 0)} SP
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Time Log */}
        {tasks.some(t => t.logs.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#4B4F54' }}>Time Log</h2>
            <div className="space-y-4">
              {tasks.filter(t => t.logs.length > 0).map(task => (
                <div key={task.id} className="border-l-4 pl-4" style={{ borderColor: '#236192' }}>
                  <h3 className="font-medium mb-2" style={{ color: '#4B4F54' }}>{task.name}</h3>
                  <div className="space-y-1">
                    {task.logs.map((log, idx) => (
                      <div key={idx} className="text-sm text-gray-600 font-mono">
                        {formatLogTime(log.startTime)} - {log.endTime ? formatLogTime(log.endTime) : 'ongoing'} 
                        <span className="ml-2 text-gray-500">
                          ({formatTime(log.endTime ? log.endTime - log.startTime : currentTime - log.startTime)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
