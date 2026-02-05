 import { useEffect, useState, useRef } from 'react';
import { useClickOutside } from '../hooks/use-click-outside';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { CustomModal } from '../components/ui/custom-modal';
import { useLoading } from '../components/ui/loading';
import { CheckCircle2, Circle, Edit2, Plus, Trash2, ClipboardList, Flag, Search, X } from 'lucide-react';
import { API_BASE_URL } from '../utils/config';

export function AdminTaskManagement() {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [graduates, setGraduates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { setLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  // Add Milestone Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGraduateDropdownOpen, setIsGraduateDropdownOpen] = useState(false);
  const addGraduateDropdownRef = useClickOutside<HTMLDivElement>(() => setIsGraduateDropdownOpen(false), isGraduateDropdownOpen);

  const [newMilestone, setNewMilestone] = useState<{
    title: string;
    week_label: string;
    start_week: string;
    end_week: string;
    tasks: string[];
    graduate_ids: string[];
  }>({
    title: "",
    week_label: "",
    start_week: "",
    end_week: "",
    tasks: [],
    graduate_ids: []
  });

  // Delete Modal State
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [milestoneToDelete, setMilestoneToDelete] = useState<any | null>(null); // Group object

  // Edit Modal State
  const [isEditGraduateDropdownOpen, setIsEditGraduateDropdownOpen] = useState(false);
  const editGraduateDropdownRef = useClickOutside<HTMLDivElement>(() => setIsEditGraduateDropdownOpen(false), isEditGraduateDropdownOpen);

  const [editingMilestone, setEditingMilestone] = useState<{
    id: string; 
    ids: string[]; 
    milestone_map: { [key: string]: string }; 
    is_global: boolean;
    global_id: string | null;
    title: string;
    week_label: string;
    start_week: string;
    end_week: string;
    tasks: { id?: string; name: string }[];
    graduate_ids: string[]; 
  } | null>(null);

  const getGraduateName = (graduateId: string | null) => {
    if (!graduateId) return 'Global (All Graduates)';
    const grad = graduates.find(g => g.id === graduateId);
    return grad ? `${grad.first_name} ${grad.last_name}` : 'Unknown Graduate';
  };

  const fetchMilestones = async () => {
    setLoading(true);
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/timeline/all`);
      if (!res.ok) throw new Error('Failed to fetch milestones');
      
      const data = await res.json();
      setMilestones(data);

      // Fetch graduates
      const gradRes = await fetch(`${API_BASE_URL}/graduates/list`);
      if (gradRes.ok) {
          const gradData = await gradRes.json();
          setGraduates(gradData);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load milestones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, [setLoading]);

  // Group milestones
  const groupedMilestones = milestones.reduce((acc: any[], milestone) => {
    const key = `${milestone.title}-${milestone.week_label}-${milestone.start_week}-${milestone.end_week}`;
    const existingGroup = acc.find((g: any) => g.key === key);

    if (existingGroup) {
      existingGroup.ids.push(milestone.milestone_id);
      if (milestone.graduate_id) {
        existingGroup.graduate_ids.push(milestone.graduate_id);
        existingGroup.milestone_map[milestone.graduate_id] = milestone.milestone_id;
      } else {
         existingGroup.is_global = true;
         existingGroup.global_id = milestone.milestone_id;
      }
      if (milestone.status !== 'completed') {
          existingGroup.status = 'active';
      }
    } else {
      acc.push({
        key,
        primary_id: milestone.milestone_id,
        ids: [milestone.milestone_id],
        title: milestone.title,
        week_label: milestone.week_label,
        start_week: milestone.start_week,
        end_week: milestone.end_week,
        created_at: milestone.created_at,
        status: milestone.status,
        tasks: milestone.tasks,
        graduate_ids: milestone.graduate_id ? [milestone.graduate_id] : [],
        milestone_map: milestone.graduate_id ? { [milestone.graduate_id]: milestone.milestone_id } : {},
        is_global: !milestone.graduate_id,
        global_id: !milestone.graduate_id ? milestone.milestone_id : null
      });
    }
    return acc;
  }, []);

  const milestoneRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMilestone = (key: string) => {
    const el = milestoneRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMarkDone = async (group: any) => {
    const newStatus = group.status === 'completed' ? 'active' : 'completed';
    setLoading(true);
    try {
        // Update all milestones in the group
        await Promise.all(group.ids.map((id: string) => 
            fetch(`${API_BASE_URL}/timeline/milestone/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
        ));
        
        await fetchMilestones();
    } catch (err: any) {
        console.error(err);
        setError("Failed to update milestone status");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = (group: any) => {
    setMilestoneToDelete(group);
  };

  const confirmDeleteMilestone = async () => {
    if (!milestoneToDelete) return;
    setLoading(true);
    try {
        // Delete all milestones in the group
        await Promise.all(milestoneToDelete.ids.map((id: string) => 
            fetch(`${API_BASE_URL}/timeline/milestone/${id}`, {
                method: 'DELETE'
            })
        ));
        
        await fetchMilestones();
        setMilestoneToDelete(null);
    } catch (err: any) {
        console.error(err);
        setError("Failed to delete milestone");
    } finally {
        setLoading(false);
    }
  };

  const handleModify = (group: any) => {
    setEditingMilestone({
      id: group.primary_id,
      ids: group.ids,
      milestone_map: group.milestone_map,
      is_global: group.is_global,
      global_id: group.global_id,
      title: group.title,
      week_label: group.week_label,
      start_week: group.start_week ? String(group.start_week) : "",
      end_week: group.end_week ? String(group.end_week) : "",
      tasks: group.tasks.map((t: any) => ({ id: t.task_id, name: t.name })),
      graduate_ids: group.graduate_ids
    });
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
    if (!editingMilestone.title || !editingMilestone.start_week || !editingMilestone.end_week) {
      alert("Please fill in Milestone Title, Start Week, and End Week");
      return;
    }

    const start = parseInt(editingMilestone.start_week);
    const end = parseInt(editingMilestone.end_week);
    const generatedWeekLabel = start === end ? `Week ${start}` : `Weeks ${start}-${end}`;

    const currentGradIds = editingMilestone.graduate_ids;
    const originalMap = editingMilestone.milestone_map;

    setLoading(true);
    try {
        // 1. Handle Global Logic
        if (currentGradIds.length === 0) {
            // Target is Global
            if (!editingMilestone.is_global) {
                // Was Specific -> Switch to Global
                // Delete all specific
                await Promise.all(editingMilestone.ids.map(id => 
                    fetch(`${API_BASE_URL}/timeline/milestone/${id}`, { method: 'DELETE' })
                ));
                // Create Global
                await fetch(`${API_BASE_URL}/timeline/milestone`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: editingMilestone.title,
                        week_label: generatedWeekLabel,
                        start_week: start,
                        end_week: end,
                        tasks: editingMilestone.tasks.filter(t => t.name.trim() !== "").map(t => t.name),
                        graduate_ids: [] // Empty = Global
                    })
                });
            } else {
                // Was Global -> Update Global
                await fetch(`${API_BASE_URL}/timeline/milestone/${editingMilestone.global_id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: editingMilestone.title,
                        week_label: generatedWeekLabel,
                        start_week: start,
                        end_week: end,
                        tasks: editingMilestone.tasks.filter(t => t.name.trim() !== ""),
                        graduate_ids: []
                    })
                });
            }
        } else {
            // Target is Specific
            if (editingMilestone.is_global && editingMilestone.global_id) {
                // Was Global -> Switch to Specific
                // Delete Global
                await fetch(`${API_BASE_URL}/timeline/milestone/${editingMilestone.global_id}`, { method: 'DELETE' });
                // Create Specifics
                await fetch(`${API_BASE_URL}/timeline/milestone`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: editingMilestone.title,
                        week_label: generatedWeekLabel,
                        start_week: start,
                        end_week: end,
                        tasks: editingMilestone.tasks.filter(t => t.name.trim() !== "").map(t => t.name),
                        graduate_ids: currentGradIds
                    })
                });
            } else {
                // Was Specific -> Update Specific
                const gradsToAdd = currentGradIds.filter(gid => !originalMap[gid]);
                const gradsToRemove = Object.keys(originalMap).filter(gid => !currentGradIds.includes(gid));
                const gradsToUpdate = currentGradIds.filter(gid => originalMap[gid]);

                const tasksPayload = editingMilestone.tasks.filter(t => t.name.trim() !== "");

                // Add new
                if (gradsToAdd.length > 0) {
                    await fetch(`${API_BASE_URL}/timeline/milestone`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: editingMilestone.title,
                            week_label: generatedWeekLabel,
                            start_week: start,
                            end_week: end,
                            tasks: tasksPayload.map(t => t.name), // Create expects strings
                            graduate_ids: gradsToAdd
                        })
                    });
                }

                // Remove old
                if (gradsToRemove.length > 0) {
                    await Promise.all(gradsToRemove.map(gid => 
                        fetch(`${API_BASE_URL}/timeline/milestone/${originalMap[gid]}`, { method: 'DELETE' })
                    ));
                }

                // Update existing
                if (gradsToUpdate.length > 0) {
                    await Promise.all(gradsToUpdate.map(gid => 
                        fetch(`${API_BASE_URL}/timeline/milestone/${originalMap[gid]}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                title: editingMilestone.title,
                                week_label: generatedWeekLabel,
                                start_week: start,
                                end_week: end,
                                tasks: tasksPayload, // Update expects objects with IDs
                                graduate_ids: [gid] // Update singular to avoid copies
                            })
                        })
                    ));
                }
            }
        }

      await fetchMilestones();
      setEditingMilestone(null);
    } catch (err: any) {
      console.error(err);
      setError("Failed to update milestone");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = () => {
    setNewMilestone({ title: "", week_label: "", start_week: "", end_week: "", tasks: [], graduate_ids: [] });
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
    if (!newMilestone.title || !newMilestone.start_week || !newMilestone.end_week) {
      alert("Please fill in Milestone Title, Start Week, and End Week");
      return;
    }
    
    const start = parseInt(newMilestone.start_week);
    const end = parseInt(newMilestone.end_week);
    const generatedWeekLabel = start === end ? `Week ${start}` : `Weeks ${start}-${end}`;

    setLoading(true);
    try {
        const res = await fetch(`${API_BASE_URL}/timeline/milestone`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newMilestone.title,
                week_label: generatedWeekLabel,
                start_week: start,
                end_week: end,
                tasks: newMilestone.tasks.filter(t => t.trim() !== ""),
                graduate_ids: newMilestone.graduate_ids
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Failed to create milestone');
        }

        await fetchMilestones();
        
        setNewMilestone({
          title: "",
          week_label: "",
          start_week: "",
          end_week: "",
          tasks: [],
          graduate_ids: []
        });
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
        const res = await fetch(`${API_BASE_URL}/timeline/all`, {
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

  const totalTasks = groupedMilestones.reduce((acc, m) => acc + (m.tasks?.length || 0), 0);

  const filteredMilestones = groupedMilestones.filter(milestone => 
    milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    milestone.tasks.some((task: any) => task.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        {/* <div>
          <p className="text-muted-foreground">
            Manage tasks and milestones for the graduate program
          </p>
        </div> */}
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
              <span className="text-xl font-bold text-black !text-black" style={{ color: 'black' }}>{filteredMilestones.length}</span>
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
      {groupedMilestones.length > 0 && (
        <div className="flex w-full gap-1 overflow-x-auto pb-2">
          {groupedMilestones.map((milestone) => (
            <div 
              key={milestone.key} 
              onClick={() => scrollToMilestone(milestone.key)}
              className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
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
          <div
            key={milestone.key}
            ref={(el) => {
              milestoneRefs.current[milestone.key] = el;
            }}
          >
          <Card className="p-6 border-gray-200 relative overflow-hidden">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {milestone.week_label}
                  {milestone.created_at && ` • Added ${new Date(milestone.created_at).toLocaleDateString()}`}
                  <span className="block mt-1 text-blue-600 font-medium flex flex-wrap items-center gap-1">
                    Assigned to: {milestone.graduate_ids.length > 0 
                      ? milestone.graduate_ids.map((gid: string) => getGraduateName(gid)).join(', ') 
                      : "Global (All Graduates)"}
                  </span>
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
                  onClick={() => handleModify(milestone)}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Modify
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleMarkDone(milestone)}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-black dark:text-white"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Done
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(milestone)}
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
          </div>
        ))}

        {groupedMilestones.length === 0 && !error && (
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-week">Start Week</Label>
              <Input
                id="start-week"
                type="number"
                min="1"
                placeholder="1"
                value={newMilestone.start_week}
                onChange={(e) => setNewMilestone({ ...newMilestone, start_week: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-week">End Week</Label>
              <Input
                id="end-week"
                type="number"
                min="1"
                placeholder="1"
                value={newMilestone.end_week}
                onChange={(e) => setNewMilestone({ ...newMilestone, end_week: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2 relative" ref={addGraduateDropdownRef}>
            <Label>Assign to Graduates</Label>
            <div 
              className="border rounded-md p-2 cursor-pointer bg-white dark:bg-zinc-950 border-gray-200 dark:border-gray-700 flex justify-between items-center"
              onClick={() => setIsGraduateDropdownOpen(!isGraduateDropdownOpen)}
            >
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {newMilestone.graduate_ids.length === 0 
                  ? "Select Graduates (Optional)" 
                  : `${newMilestone.graduate_ids.length} Graduate(s) Selected`}
              </span>
              <span className="text-gray-400">▼</span>
            </div>

            {isGraduateDropdownOpen && (
              <div className="absolute top-[75px] left-0 right-0 z-50 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto p-2">
                <div 
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                  onClick={() => {
                    if (newMilestone.graduate_ids.length === graduates.length) {
                        setNewMilestone({...newMilestone, graduate_ids: []});
                    } else {
                        setNewMilestone({...newMilestone, graduate_ids: graduates.map(g => g.id)});
                    }
                  }}
                >
                    <input 
                        type="checkbox" 
                        checked={newMilestone.graduate_ids.length === graduates.length && graduates.length > 0}
                        readOnly
                        className="pointer-events-none"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Select All</span>
                </div>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                {graduates.map((grad) => (
                  <div 
                    key={grad.id} 
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                    onClick={() => {
                        const ids = newMilestone.graduate_ids.includes(grad.id)
                            ? newMilestone.graduate_ids.filter(id => id !== grad.id)
                            : [...newMilestone.graduate_ids, grad.id];
                        setNewMilestone({ ...newMilestone, graduate_ids: ids });
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={newMilestone.graduate_ids.includes(grad.id)} 
                      readOnly
                      className="pointer-events-none"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{grad.first_name} {grad.last_name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
                Leave empty to create a Global Milestone visible to everyone. Select specific graduates to create individual copies.
            </p>
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
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="edit-start-week">Start Week</Label>
                    <Input
                    id="edit-start-week"
                    type="number"
                    min="1"
                    value={editingMilestone.start_week}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, start_week: e.target.value })}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="edit-end-week">End Week</Label>
                    <Input
                    id="edit-end-week"
                    type="number"
                    min="1"
                    value={editingMilestone.end_week}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, end_week: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid gap-2 relative" ref={editGraduateDropdownRef}>
            <Label>Assign to Graduates</Label>
            <div 
              className="border rounded-md p-2 cursor-pointer bg-white dark:bg-zinc-950 border-gray-200 dark:border-gray-700 flex justify-between items-center"
              onClick={() => setIsEditGraduateDropdownOpen(!isEditGraduateDropdownOpen)}
            >
              <span className="text-sm text-gray-900 dark:text-gray-100">
                {editingMilestone.graduate_ids.length === 0 
                  ? "Select Graduates (Optional)" 
                  : `${editingMilestone.graduate_ids.length} Graduate(s) Selected`}
              </span>
              <span className="text-gray-400">▼</span>
            </div>

            {isEditGraduateDropdownOpen && (
              <div className="absolute top-[75px] left-0 right-0 z-50 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto p-2">
                <div 
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                  onClick={() => {
                    if (editingMilestone.graduate_ids.length === graduates.length) {
                        setEditingMilestone({...editingMilestone, graduate_ids: []});
                    } else {
                        setEditingMilestone({...editingMilestone, graduate_ids: graduates.map(g => g.id)});
                    }
                  }}
                >
                    <input 
                        type="checkbox" 
                        checked={editingMilestone.graduate_ids.length === graduates.length && graduates.length > 0}
                        readOnly
                        className="pointer-events-none"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Select All</span>
                </div>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                {graduates.map((grad) => (
                  <div 
                    key={grad.id} 
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
                    onClick={() => {
                        const ids = editingMilestone.graduate_ids.includes(grad.id)
                            ? editingMilestone.graduate_ids.filter(id => id !== grad.id)
                            : [...editingMilestone.graduate_ids, grad.id];
                        setEditingMilestone({ ...editingMilestone, graduate_ids: ids });
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={editingMilestone.graduate_ids.includes(grad.id)} 
                      readOnly
                      className="pointer-events-none"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{grad.first_name} {grad.last_name}</span>
                  </div>
                ))}
              </div>
            )}
             <p className="text-xs text-muted-foreground">
                Deselect all to switch to Global Milestone. Select specific graduates to assign individually.
            </p>
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
        overlayOpacity={0}
        overlayBlur={0}
        zIndex={2147483601}
        footer={
            <>
                <Button variant="outline" onClick={() => setMilestoneToDelete(null)}>
                    Cancel
                </Button>
                <Button 
                    variant="destructive" 
                    onClick={confirmDeleteMilestone}
                >
                    Delete
                </Button>
            </>
        }
      >
        <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the milestone "{milestoneToDelete?.title}"?
            <br/><br/>
            This will delete it for <strong>{milestoneToDelete?.graduate_ids.length > 0 ? `${milestoneToDelete?.graduate_ids.length} assigned graduates` : "ALL graduates (Global)"}</strong>.
            <br/>
            This action cannot be undone.
        </p>
      </CustomModal>

      {/* Delete All Modal */}
      <CustomModal
        open={isDeleteAllOpen}
        onClose={() => setIsDeleteAllOpen(false)}
        title="Delete All Milestones"
        overlayOpacity={0}
        overlayBlur={0}
        zIndex={2147483601}
        footer={
            <>
                <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)}>
                    Cancel
                </Button>
                <Button 
                    variant="destructive" 
                    onClick={confirmDeleteAll}
                >
                    Delete All
                </Button>
            </>
        }
      >
        <p className="text-sm text-muted-foreground">
            Are you sure you want to delete ALL milestones for ALL graduates? This action cannot be undone.
        </p>
      </CustomModal>
    </div>
  );
}
