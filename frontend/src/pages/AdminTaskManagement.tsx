import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CustomModal } from '../components/ui/custom-modal';
import { useLoading } from '../components/ui/loading';
import { CheckCircle2, Circle, Edit2, Plus, Trash2, ClipboardList, Flag, Search, X } from 'lucide-react';

export function AdminTaskManagement() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Add Milestone Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMilestone, setNewMilestone] = useState<{
    title: string;
    week_label: string;
    tasks: string[];
  }>({
    title: "",
    week_label: "",
    tasks: []
  });

  // Delete Modal State
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null);

  // Edit Modal State
  const [editingMilestone, setEditingMilestone] = useState<{
    id: string;
    title: string;
    week_label: string;
    tasks: { id?: string; name: string }[];
  } | null>(null);

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

  const handleMarkDone = async (milestoneId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
    setLoading(true);
    try {
        const res = await fetch(`http://127.0.0.1:8000/timeline/milestone/${milestoneId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error("Failed to update status");
        
        // Refresh
        const refreshRes = await fetch('http://127.0.0.1:8000/timeline/all');
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            setMilestones(data);
        }
    } catch (err: any) {
        console.error(err);
        setError("Failed to update milestone status");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = (milestoneId: string) => {
    setMilestoneToDelete(milestoneId);
  };

  const confirmDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setLoading(true);
    try {
        const res = await fetch(`http://127.0.0.1:8000/timeline/milestone/${milestoneToDelete}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete milestone");
        
        // Refresh
        const refreshRes = await fetch('http://127.0.0.1:8000/timeline/all');
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            setMilestones(data);
        }
        setMilestoneToDelete(null);
    } catch (err: any) {
        console.error(err);
        setError("Failed to delete milestone");
    } finally {
        setLoading(false);
    }
  };

  const handleModify = (milestoneId: string) => {
    const milestone = milestones.find(m => m.milestone_id === milestoneId);
    if (milestone) {
      setEditingMilestone({
        id: milestone.milestone_id,
        title: milestone.title,
        week_label: milestone.week_label,
        tasks: milestone.tasks.map((t: any) => ({ id: t.task_id, name: t.name }))
      });
    }
  };

  const handleEditTaskChange = (index: number, value: string) => {
    if (!editingMilestone) return;
    const updatedTasks = [...editingMilestone.tasks];
    updatedTasks[index] = { ...updatedTasks[index], name: value };
    setEditingMilestone({ ...editingMilestone, tasks: updatedTasks });
  };

  const handleAddEditTask = () => {
    if (!editingMilestone) return;
    setEditingMilestone({
      ...editingMilestone,
      tasks: [...editingMilestone.tasks, { name: "" }]
    });
  };

  const handleRemoveEditTask = (index: number) => {
    if (!editingMilestone) return;
    const updatedTasks = editingMilestone.tasks.filter((_, i) => i !== index);
    setEditingMilestone({ ...editingMilestone, tasks: updatedTasks });
  };

  const handleSaveEdit = async () => {
    if (!editingMilestone) return;
    if (!editingMilestone.title || !editingMilestone.week_label) {
      alert("Please fill in Milestone Title and Week Label");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/timeline/milestone/${editingMilestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingMilestone.title,
          week_label: editingMilestone.week_label,
          tasks: editingMilestone.tasks.filter(t => t.name.trim() !== "")
        })
      });

      if (!res.ok) throw new Error("Failed to update milestone");

      // Refresh
      const refreshRes = await fetch('http://127.0.0.1:8000/timeline/all');
      if (refreshRes.ok) {
          const data = await refreshRes.json();
          setMilestones(data);
      }
      setEditingMilestone(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to update milestone");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    setNewMilestone({ title: "", week_label: "", tasks: [] });
    setIsAddModalOpen(true);
  };

  const handleAddTask = () => {
    setNewMilestone({ ...newMilestone, tasks: [...newMilestone.tasks, ""] });
  };

  const handleTaskChange = (index: number, value: string) => {
    const updatedTasks = [...newMilestone.tasks];
    updatedTasks[index] = value;
    setNewMilestone({ ...newMilestone, tasks: updatedTasks });
  };

  const handleRemoveTask = (index: number) => {
    const updatedTasks = newMilestone.tasks.filter((_, i) => i !== index);
    setNewMilestone({ ...newMilestone, tasks: updatedTasks });
  };

  const handleSaveMilestone = async () => {
    if (!newMilestone.title || !newMilestone.week_label) {
      alert("Please fill in Milestone Title and Week Label");
      return;
    }
    
    setLoading(true);
    try {
        const res = await fetch('http://127.0.0.1:8000/timeline/milestone', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newMilestone.title,
                week_label: newMilestone.week_label,
                tasks: newMilestone.tasks.filter(t => t.trim() !== "")
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to create milestone');
        }

        // Refresh list
        const refreshRes = await fetch('http://127.0.0.1:8000/timeline/all');
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            setMilestones(data);
        }
        
        setIsAddModalOpen(false);
    } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to create milestone");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteAll = () => {
    setIsDeleteAllOpen(true);
  };

  const confirmDeleteAll = async () => {
    setLoading(true);
    try {
        const res = await fetch('http://127.0.0.1:8000/timeline/all', {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error("Failed to delete all milestones");
        
        setMilestones([]);
        setIsDeleteAllOpen(false);
    } catch (err: any) {
        console.error(err);
        setError("Failed to delete all milestones");
    } finally {
        setLoading(false);
    }
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

      {/* Milestone Track Bar */}
      {milestones.length > 0 && (
        <div className="flex w-full gap-1 overflow-x-auto pb-2">
          {milestones.map((milestone) => (
            <div 
              key={milestone.milestone_id} 
              className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                milestone.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-1 w-full overflow-hidden">
                <span className={`text-sm font-bold whitespace-nowrap overflow-hidden text-ellipsis ${
                  milestone.status === 'completed' ? 'text-green-700' : 'text-gray-500'
                }`}>
                  {milestone.title}
                </span>
                {milestone.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                )}
              </div>
              <div className={`w-full h-1.5 rounded-full ${
                milestone.status === 'completed' ? 'bg-green-600' : 'bg-gray-300'
              }`} />
            </div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {filteredMilestones.map((milestone) => (
          <Card key={milestone.milestone_id} className="p-6 border-gray-200 relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {milestone.week_label}
                  {milestone.created_at && ` • Added ${new Date(milestone.created_at).toLocaleDateString()}`}
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">{milestone.title}</h3>
                  {milestone.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 fill-green-100" />
                  )}
                </div>
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
                  onClick={() => handleMarkDone(milestone.milestone_id, milestone.status)}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-black dark:text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Done
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(milestone.milestone_id)}
                  className="gap-2 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
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

      <CustomModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Milestone"
        overlayOpacity={0}
        overlayBlur={0}
        zIndex={2147483601}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveMilestone} 
              className="!bg-blue-600 !text-white hover:!bg-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              Publish
            </Button>
          </>
        }
      >
        <div className="grid gap-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Create a new milestone with tasks for the graduate program.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="title">Milestone Title</Label>
            <Input
              id="title"
              placeholder="e.g. IBM Instana Practitioner"
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="week">Week Specification</Label>
            <Input
              id="week"
              placeholder="e.g. Week 1"
              value={newMilestone.week_label}
              onChange={(e) => setNewMilestone({ ...newMilestone, week_label: e.target.value })}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Tasks</Label>
            <div className="space-y-2">
              {newMilestone.tasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Task ${index + 1}`}
                    value={task}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTask(index)}
                    className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button
              variant="outline"
              onClick={handleAddTask}
              className="w-full mt-2 gap-2 border-dashed"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </div>
        </div>
      </CustomModal>

      {/* Edit Milestone Modal */}
      <CustomModal
        open={!!editingMilestone}
        onClose={() => setEditingMilestone(null)}
        title="Edit Milestone"
        overlayOpacity={0}
        overlayBlur={0}
        zIndex={2147483601}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingMilestone(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              className="!bg-blue-600 !text-white hover:!bg-blue-700"
              style={{ backgroundColor: '#2563eb', color: 'white' }}
            >
              Update
            </Button>
          </>
        }
      >
        {editingMilestone && (
            <div className="grid gap-4 pb-4">
            <p className="text-sm text-muted-foreground">
                Update milestone details and tasks.
            </p>
            <div className="grid gap-2">
                <Label htmlFor="edit-title">Milestone Title</Label>
                <Input
                id="edit-title"
                placeholder="e.g. IBM Instana Practitioner"
                value={editingMilestone.title}
                onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                />
            </div>
            
            <div className="grid gap-2">
                <Label htmlFor="edit-week">Week Specification</Label>
                <Input
                id="edit-week"
                placeholder="e.g. Week 1"
                value={editingMilestone.week_label}
                onChange={(e) => setEditingMilestone({ ...editingMilestone, week_label: e.target.value })}
                />
            </div>
            
            <div className="grid gap-2">
                <Label>Tasks</Label>
                <div className="space-y-2">
                {editingMilestone.tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                    <Input
                        placeholder={`Task ${index + 1}`}
                        value={task.name}
                        onChange={(e) => handleEditTaskChange(index, e.target.value)}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveEditTask(index)}
                        className="h-10 w-10 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    </div>
                ))}
                </div>
                
                <Button
                variant="outline"
                onClick={handleAddEditTask}
                className="w-full mt-2 gap-2 border-dashed"
                >
                <Plus className="w-4 h-4" />
                Add Task
                </Button>
            </div>
            </div>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        open={!!milestoneToDelete}
        onClose={() => setMilestoneToDelete(null)}
        title="Confirm Deletion"
        zIndex={2147483601}
        footer={
          <>
            <Button variant="outline" onClick={() => setMilestoneToDelete(null)}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteMilestone} className="!bg-red-600 !text-white hover:!bg-red-700" style={{ backgroundColor: '#dc2626', color: 'white' }}>
              Delete Milestone
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this milestone? This action cannot be undone and will remove all associated tasks.
          </p>
        </div>
      </CustomModal>

      {/* Delete All Confirmation Modal */}
      <CustomModal
        open={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        title="Confirm Delete All"
        zIndex={2147483601}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDeleteAll} className="!bg-red-600 !text-white hover:!bg-red-700" style={{ backgroundColor: '#dc2626', color: 'white' }}>
              Delete All Data
            </Button>
          </>
        }
      >
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            Are you absolutely sure? This will delete ALL milestones and tasks from the system. This action cannot be undone.
          </p>
        </div>
      </CustomModal>
    </div>
  );
}
