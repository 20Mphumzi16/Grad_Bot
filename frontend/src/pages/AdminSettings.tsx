import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { 
  Settings,
  Database,
  Shield,
  Bell,
  Zap
} from 'lucide-react';
import { Separator } from '../components/ui/separator';

export function AdminSettings() {
  return (
    <div className="pt-8 space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your knowledge assistant settings</p>
      </div>

      {/* General Settings */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">General Settings</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="assistant-name">Assistant Name</Label>
            <Input
              id="assistant-name"
              defaultValue="Grad Knowledge Assistant"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              defaultValue="Hello! I'm your Graduate Programme Knowledge Assistant. How can I help you today?"
              className="rounded-xl"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Response Length (tokens)</Label>
            <Input
              id="max-tokens"
              type="number"
              defaultValue="500"
              className="rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* RAG Settings */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">RAG Configuration</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="chunk-size">Chunk Size</Label>
            <Input
              id="chunk-size"
              type="number"
              defaultValue="512"
              className="rounded-xl"
            />
            <p className="text-sm text-gray-500">Number of tokens per document chunk</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="top-k">Top-K Results</Label>
            <Input
              id="top-k"
              type="number"
              defaultValue="5"
              className="rounded-xl"
            />
            <p className="text-sm text-gray-500">Number of relevant chunks to retrieve</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="similarity-threshold">Similarity Threshold</Label>
            <Input
              id="similarity-threshold"
              type="number"
              step="0.01"
              defaultValue="0.75"
              className="rounded-xl"
            />
            <p className="text-sm text-gray-500">Minimum similarity score for retrieval (0-1)</p>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">Security & Privacy</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Require Authentication</Label>
              <p className="text-sm text-gray-500">Users must log in to access the chatbot</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Log Conversations</Label>
              <p className="text-sm text-gray-500">Store conversation history for analytics</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Anonymous Usage Data</Label>
              <p className="text-sm text-gray-500">Collect anonymous usage statistics</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">Notifications</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Email Notifications</Label>
              <p className="text-sm text-gray-500">Receive email alerts for important events</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Failed Processing Alerts</Label>
              <p className="text-sm text-gray-500">Get notified when document processing fails</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-gray-500">Receive weekly analytics summary</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Performance Settings */}
      <Card className="p-6 border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-gray-900">Performance</h3>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Enable Caching</Label>
              <p className="text-sm text-gray-500">Cache frequent queries for faster responses</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="cache-duration">Cache Duration (minutes)</Label>
            <Input
              id="cache-duration"
              type="number"
              defaultValue="30"
              className="rounded-xl"
            />
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="outline" className="rounded-xl">
          Reset to Defaults
        </Button>
        <Button className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 rounded-xl">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
