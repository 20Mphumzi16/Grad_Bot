import { useEffect, useState, useRef } from 'react';
import { Card } from '../components/ui/card';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { useLoading } from '../components/ui/loading';
import confetti from 'canvas-confetti';
import { API_BASE_URL } from '../utils/config';

export function StudentTimeline() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const { loading, setLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const completedMilestonesRef = useRef<Set<string>>(new Set());
  const milestoneRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchMilestones = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      try {
        setError(null);
        const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const user = await userRes.json();

        const res = await fetch(
          `${API_BASE_URL}/timeline/${user.id}/milestones-tasks`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error('Failed to fetch milestones');

        const data = await res.json();
        setMilestones(data);

        data.forEach((m: any) => {
          if (m.status === 'Completed') {
            completedMilestonesRef.current.add(m.milestone_id);
          }
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load milestones. Your session may have expired. Please try logging in again.");
        setMilestones([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [setLoading]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <div className="animate-in zoom-in duration-300">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
        );
      case 'In-Progress':
        return <Clock className="w-6 h-6 text-orange-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    return 'bg-[var(--card)]/60 backdrop-blur-sm border-white/20 shadow-sm transition-colors';
  };

  const getMilestoneProgress = (milestone: any) => {
    if (!milestone || !Array.isArray(milestone.tasks) || milestone.tasks.length === 0) {
      return 0;
    }
    const completedCount = milestone.tasks.filter((t: any) => t.completed).length;
    return (completedCount / milestone.tasks.length) * 100;
  };

  async function completeTask(token: string, graduateId: string, taskId: string) {
    await fetch(`${API_BASE_URL}/timeline/tasks/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ graduate_id: graduateId, task_id: taskId }),
    });
  }

  async function uncompleteTask(token: string, graduateId: string, taskId: string) {
    await fetch(`${API_BASE_URL}/timeline/tasks/uncomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ graduate_id: graduateId, task_id: taskId }),
    });
  }

  const handleToggleTask = async (milestoneIndex: number, taskIndex: number) => {
    // 1. Immediate Optimistic Update
    const previousMilestones = milestones;
    const updated = structuredClone(milestones);
    const milestone = updated[milestoneIndex];
    const task = milestone.tasks[taskIndex];
    const milestoneId = milestone.milestone_id;

    task.completed = !task.completed;

    // Check status
    const allDone = milestone.tasks.every((t: any) => t.completed);
    const anyDone = milestone.tasks.some((t: any) => t.completed);

    if (allDone) {
      milestone.status = 'Completed';
      if (!completedMilestonesRef.current.has(milestoneId)) {
        completedMilestonesRef.current.add(milestoneId);
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
      
      // Automatically start next milestone if it exists
      const nextMilestoneIndex = milestoneIndex + 1;
      if (nextMilestoneIndex < updated.length) {
        const nextMilestone = updated[nextMilestoneIndex];
        
        if (nextMilestone.status === 'Upcoming') {
          nextMilestone.status = 'In-Progress';
        }
          
        // Smooth scroll to the next milestone after a short delay
        setTimeout(() => {
          milestoneRefs.current[nextMilestoneIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 600);
      }
    } else {
      const wasCompleted = milestone.status === 'Completed';

      if (wasCompleted) {
        completedMilestonesRef.current.delete(milestoneId);

        // Revert next milestone to Upcoming if it has no progress
        const nextMilestoneIndex = milestoneIndex + 1;
        if (nextMilestoneIndex < updated.length) {
          const nextMilestone = updated[nextMilestoneIndex];
          const nextHasProgress = nextMilestone.tasks.some((t: any) => t.completed);
          
          if (nextMilestone.status === 'In-Progress' && !nextHasProgress) {
            nextMilestone.status = 'Upcoming';
          }
        }
      }

      if (anyDone) {
        milestone.status = 'In-Progress';
      } else {
        // No tasks completed - revert to Upcoming
        const wasActive = wasCompleted || milestone.status === 'In-Progress';
        milestone.status = 'Upcoming';

        // Scroll back to previous milestone if we just cleared this one
        if (wasActive) {
          const prevMilestoneIndex = milestoneIndex - 1;
          if (prevMilestoneIndex >= 0) {
            setTimeout(() => {
              milestoneRefs.current[prevMilestoneIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }, 600);
          }
        }
      }
    }

    setMilestones(updated);

    // 2. Background Sync
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const userRes = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const user = await userRes.json();

      task.completed
        ? await completeTask(token, user.id, task.task_id)
        : await uncompleteTask(token, user.id, task.task_id);
    } catch (error) {
      console.error("Failed to sync task", error);
      // Revert to original state
      setMilestones(previousMilestones);
    }
  };

  const overallProgress = milestones.reduce((acc, milestone) => {
    if (!milestone.tasks) return acc;
    const completed = milestone.tasks.filter((t: any) => t.completed).length;
    return {
      total: acc.total + milestone.tasks.length,
      completed: acc.completed + completed
    };
  }, { total: 0, completed: 0 });

  const progressPercentage = overallProgress.total > 0 
    ? Math.round((overallProgress.completed / overallProgress.total) * 100) 
    : 0;

  return (
    <div className="p-6">
      <style>{`
        .black-progress-indicator [data-slot="progress-indicator"] {
          background-color: black !important;
        }
      `}</style>
      <div className="w-full space-y-8">
        <Card className="p-6 bg-[var(--card)]/60 backdrop-blur-sm border-white/20 shadow-sm transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="mb-1">Overall Progress</h3>
          </div>
          <div className="text-right">
            <p className="mb-1">{progressPercentage}%</p>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-3 bg-gray-200 dark:bg-gray-700 black-progress-indicator" />
      </Card>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {error && (
          <div className="pl-16 mb-4 text-red-600 font-medium">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {milestones.map((milestone, index) => {
            const milestoneProgress = getMilestoneProgress(milestone);
            return (
              <div 
                key={index} 
                className="relative pl-16"
                ref={el => { milestoneRefs.current[index] = el }}
              >
                <div className="absolute left-3 top-6 -translate-x-1/2">
                  {getStatusIcon(milestone.status)}
                </div>

                <Card className={`p-6 ${getStatusColor(milestone.status)}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm mb-1" style={{ color: 'var(--foreground)' }}>
                          {milestone.week_label}
                          {milestone.created_at && ` • Added ${new Date(milestone.created_at).toLocaleDateString()}`}
                        </p>
                        <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>{milestone.title}</h3>
                        {milestone.admin_status === 'completed' && (
                          <p className="text-xs text-green-600 font-medium mt-1">
                            Marked as Done by Admin
                          </p>
                        )}
                      </div>

                      {milestone.status === 'Completed' && (
                        <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                      {milestone.status === 'In-Progress' && (
                        <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                          In Progress
                        </span>
                      )}
                      {milestone.status === 'Upcoming' && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {(milestone.status === 'In-Progress' || milestone.status === 'Completed') && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {milestone.status === 'Completed' ? 'Completed' : 'Progress'}
                          </span>
                          <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                            {milestoneProgress.toFixed(0)}%
                          </span>
                        </div>
                        <Progress 
                          value={milestoneProgress} 
                          className="h-2 bg-gray-200 black-progress-indicator" 
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {milestone.tasks.map((task: any, taskIndex: number) => {
                      const isCompleted = task.completed || milestone.admin_status === 'completed';
                      const isDisabled = milestone.admin_status === 'completed';

                      return (
                        <div
                          key={taskIndex}
                          onClick={() => !isDisabled && handleToggleTask(index, taskIndex)}
                          className={`flex items-center gap-3 p-3 rounded-lg bg-white/50 transition group ${
                            isDisabled ? 'cursor-default opacity-80' : 'cursor-pointer hover:bg-white'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                          <span
                            className={`text-sm ${
                              isCompleted
                                ? 'text-gray-500 line-through'
                                : 'text-[var(--foreground)] group-hover:text-black'
                            }`}
                          >
                            {task.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
