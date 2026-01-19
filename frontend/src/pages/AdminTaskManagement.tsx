import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useLoading } from '../components/ui/loading';
import { CheckCircle2, Circle, Edit2, Plus, Trash2, ClipboardList, Flag, Search } from 'lucide-react';

export function AdminTaskManagement() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleAddMilestone = () => {
    // Placeholder for Add Milestone functionality
    console.log("Add Milestone clicked");
    alert("Add Milestone clicked");
  };

  const handleDeleteAll = () => {
    // Placeholder for Delete All functionality
    console.log("Delete All clicked");
    alert("Delete All clicked");
  };

  const totalTasks = milestones.reduce((acc, milestone) => acc + (milestone.tasks?.length || 0), 0);

  const filteredMilestones = milestones.filter(milestone => 
    milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    milestone.tasks.some((task: any) => task.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="pt-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Manage tasks and milestones for the graduate program
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white !bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        {/* Left Side: Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search milestones or tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200 text-black placeholder:text-gray-500"
          />
        </div>

        {/* Right Side: Stats and Buttons */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 !bg-blue-100 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-600 !text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-black !text-black font-medium" style={{ color: 'black' }}>Total Tasks</span>
              <span className="text-xl font-bold text-black !text-black" style={{ color: 'black' }}>{totalTasks}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 !bg-blue-100 rounded-lg">
              <Flag className="w-5 h-5 text-blue-600 !text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-black !text-black font-medium" style={{ color: 'black' }}>Total Milestones</span>
              <span className="text-xl font-bold text-black !text-black" style={{ color: 'black' }}>{milestones.length}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2" />

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleAddMilestone} 
              className="gap-2 !bg-black hover:!bg-gray-800 !text-white border-0"
              style={{ backgroundColor: 'black', color: 'white' }}
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleDeleteAll}
              className="gap-2 text-white"
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 font-medium p-4 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {filteredMilestones.map((milestone) => (
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
