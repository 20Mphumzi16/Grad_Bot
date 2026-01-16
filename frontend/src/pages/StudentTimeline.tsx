import { useEffect, useState, useRef } from 'react';
import { Card } from '../components/ui/card';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { useLoading } from '../components/ui/loading';
import confetti from 'canvas-confetti';

export function StudentTimeline() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const { loading, setLoading } = useLoading();
  const completedMilestonesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const fetchMilestones = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      try {
        const userRes = await fetch('http://127.0.0.1:8000/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!userRes.ok) throw new Error('Failed to fetch user');
        const user = await userRes.json();

        const res = await fetch(
          `http://127.0.0.1:8000/timeline/${user.id}/milestones-tasks`,
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
      } catch {
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
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'In-Progress':
        return <Clock className="w-6 h-6 text-orange-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'border-green-200 bg-green-50';
      case 'In-Progress':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  async function completeTask(token: string, graduateId: string, taskId: string) {
    await fetch('http://127.0.0.1:8000/timeline/tasks/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ graduate_id: graduateId, task_id: taskId }),
    });
  }

  async function uncompleteTask(token: string, graduateId: string, taskId: string) {
    await fetch('http://127.0.0.1:8000/timeline/tasks/uncomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ graduate_id: graduateId, task_id: taskId }),
    });
  }

  const handleToggleTask = async (milestoneIndex: number, taskIndex: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const userRes = await fetch('http://127.0.0.1:8000/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = await userRes.json();

    const updated = structuredClone(milestones);
    const task = updated[milestoneIndex].tasks[taskIndex];

    task.completed = !task.completed;
    setMilestones(updated); // optimistic UI

    try {
      task.completed
        ? await completeTask(token, user.id, task.task_id)
        : await uncompleteTask(token, user.id, task.task_id);
    } catch {
      task.completed = !task.completed;
      setMilestones(structuredClone(updated));
    }

    const allDone = updated[milestoneIndex].tasks.every((t: any) => t.completed);
    const milestoneId = updated[milestoneIndex].milestone_id;

    if (allDone && !completedMilestonesRef.current.has(milestoneId)) {
      completedMilestonesRef.current.add(milestoneId);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="pt-8 space-y-8">
      <Card className="p-6 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="mb-1">Overall Progress</h3>
            <p className="text-sm text-gray-600">Day 15 of 90 • First 90 Days Programme</p>
          </div>
          <div className="text-right">
            <p className="mb-1">25%</p>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>
        <Progress value={25} className="h-3" />
      </Card>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

        <div className="space-y-8">
          {milestones.map((milestone, index) => (
            <div key={index} className="relative pl-16">
              <div className="absolute left-3 top-6 -translate-x-1/2">
                {getStatusIcon(milestone.status)}
              </div>

              <Card className={`p-6 ${getStatusColor(milestone.status)}`}>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{milestone.week_label}</p>
                      <h3>{milestone.title}</h3>
                    </div>

                    {/* ✅ STATUS LOZENGE RESTORED */}
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
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm text-gray-900">
                          {milestone.progress.toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={milestone.progress} className="h-2" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {milestone.tasks.map((task: any, taskIndex: number) => (
                    <div
                      key={taskIndex}
                      onClick={() => handleToggleTask(index, taskIndex)}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/50 cursor-pointer hover:bg-white transition"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-gray-400" />
                      )}
                      <span
                        className={`text-sm ${
                          task.completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {task.name}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
