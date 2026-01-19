import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useLoading } from '../components/ui/loading';
import { CheckCircle2, Circle, Edit2 } from 'lucide-react';

export function AdminTaskManagement() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const { setLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMilestones = async () => {
      setLoading(true);
      try {
        setError(null);
        const res = await fetch('http://127.0.0.1:8000/timeline/all');
        if (!res.ok) throw new Error('Failed to fetch milestones');
        
        const data = await res.json();
        setMilestones(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load milestones.");
      } finally {
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [setLoading]);

  const handleMarkDone = (milestoneId: string) => {
    // Placeholder for Mark Done functionality
    console.log(`Mark Done clicked for milestone ${milestoneId}`);
    alert(`Mark Done clicked for milestone ${milestoneId}`);
  };

  const handleModify = (milestoneId: string) => {
    // Placeholder for Modify functionality
    console.log(`Modify clicked for milestone ${milestoneId}`);
    alert(`Modify clicked for milestone ${milestoneId}`);
  };

  return (
    <div className="pt-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage tasks and milestones for the graduate program
          </p>
        </div>
      </div>

      {error && (
        <div className="text-red-600 font-medium p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {milestones.map((milestone) => (
          <Card key={milestone.milestone_id} className="p-6 border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{milestone.week_label}</p>
                <h3 className="text-xl font-semibold">{milestone.title}</h3>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleModify(milestone.milestone_id)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Modify
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleMarkDone(milestone.milestone_id)}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-black dark:text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Done
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {milestone.tasks.map((task: any) => (
                <div
                  key={task.task_id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 dark:bg-zinc-800 dark:border-zinc-700"
                >
                  <Circle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.name}</span>
                </div>
              ))}
              {milestone.tasks.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No tasks in this milestone</p>
              )}
            </div>
          </Card>
        ))}

        {milestones.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground">
            No milestones found.
          </div>
        )}
      </div>
    </div>
  );
}
