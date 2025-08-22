import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Plus, Settings, Trash2, Eye, Tag } from "lucide-react";
import { useRuleStore, useDatasetStore } from "@/stores";
import { Rule, Filter, Aggregation, Obfuscation } from "@/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Rules() {
  const { rules, addRule, removeRule } = useRuleStore();
  const { datasets } = useDatasetStore();
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    datasetId: '',
    fields: [] as string[],
    ttlMinutes: '1440', // 24 hours
    tags: [] as string[],
    obfuscation: {
      jitter: 0,
      rounding: 0,
      kAnonymity: 0,
      dropPII: true,
      noiseLevel: 'low' as 'low' | 'medium' | 'high'
    }
  });

  const handleCreate = () => {
    if (!formData.name || !formData.datasetId || formData.fields.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const rule: Rule = {
      id: crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      datasetId: formData.datasetId,
      fields: formData.fields,
      filters: [],
      aggregations: [],
      obfuscation: formData.obfuscation,
      ttlMinutes: parseInt(formData.ttlMinutes),
      tags: formData.tags,
      createdAt: new Date().toISOString()
    };

    addRule(rule);
    toast.success('Rule created successfully!');
    setShowCreateDialog(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      datasetId: '',
      fields: [],
      ttlMinutes: '1440',
      tags: [],
      obfuscation: {
        jitter: 0,
        rounding: 0,
        kAnonymity: 0,
        dropPII: true,
        noiseLevel: 'low'
      }
    });
  };

  const handleDelete = (id: string) => {
    removeRule(id);
    toast.success('Rule deleted');
  };

  const toggleField = (fieldName: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldName)
        ? prev.fields.filter(f => f !== fieldName)
        : [...prev.fields, fieldName]
    }));
  };

  const selectedDataset = datasets.find(d => d.id === formData.datasetId);

  const ruleTemplates = [
    {
      name: "Basic Privacy",
      description: "Remove PII and add light obfuscation",
      config: { dropPII: true, jitter: 5, noiseLevel: 'low' as const }
    },
    {
      name: "High Security",
      description: "Strong anonymization with k-anonymity",
      config: { dropPII: true, kAnonymity: 5, noiseLevel: 'high' as const }
    },
    {
      name: "Analytics Safe",
      description: "Optimized for analytics while protecting privacy",
      config: { dropPII: true, rounding: 10, noiseLevel: 'medium' as const }
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Privacy Rules
          </h1>
          <p className="text-muted-foreground">
            Define how your data should be filtered and protected
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-200">
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Privacy Rule</DialogTitle>
              <DialogDescription>
                Define how your data should be filtered and protected
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ruleName">Rule Name *</Label>
                  <Input
                    id="ruleName"
                    placeholder="e.g., Health Data Privacy Rule"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="dataset">Source Dataset *</Label>
                  <Select value={formData.datasetId} onValueChange={(value) => setFormData({...formData, datasetId: value, fields: []})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map(dataset => (
                        <SelectItem key={dataset.id} value={dataset.id}>
                          {dataset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this rule does..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="ttl">Time to Live (TTL)</Label>
                  <Select value={formData.ttlMinutes} onValueChange={(value) => setFormData({...formData, ttlMinutes: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="360">6 hours</SelectItem>
                      <SelectItem value="1440">24 hours</SelectItem>
                      <SelectItem value="4320">3 days</SelectItem>
                      <SelectItem value="10080">1 week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Field Selection */}
              {selectedDataset && (
                <div>
                  <Label>Fields to Include *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select which fields from the dataset to include in the stream
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-border/50 rounded-lg p-3">
                    {selectedDataset.schema.map(column => (
                      <div key={column.name} className="flex items-center space-x-2">
                        <Checkbox
                          id={column.name}
                          checked={formData.fields.includes(column.name)}
                          onCheckedChange={() => toggleField(column.name)}
                        />
                        <Label htmlFor={column.name} className="text-sm flex items-center gap-2">
                          {column.name}
                          <Badge variant={column.pii ? "destructive" : "outline"} className="text-xs">
                            {column.type}
                          </Badge>
                          {column.pii && <Badge variant="destructive" className="text-xs">PII</Badge>}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Privacy Templates */}
              <div>
                <Label>Privacy Templates</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Quick-start templates for common privacy patterns
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {ruleTemplates.map(template => (
                    <Button
                      key={template.name}
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        obfuscation: { ...prev.obfuscation, ...template.config }
                      }))}
                      className="justify-start h-auto p-3"
                    >
                      <div className="text-left">
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Obfuscation Settings */}
              <div>
                <Label>Privacy Protection</Label>
                <div className="space-y-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dropPII"
                      checked={formData.obfuscation.dropPII}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        obfuscation: { ...prev.obfuscation, dropPII: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="dropPII">Automatically drop PII fields</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="noise">Noise Level</Label>
                      <Select 
                        value={formData.obfuscation.noiseLevel} 
                        onValueChange={(value: 'low' | 'medium' | 'high') => 
                          setFormData(prev => ({
                            ...prev,
                            obfuscation: { ...prev.obfuscation, noiseLevel: value }
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="kAnonymity">K-Anonymity</Label>
                      <Input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.obfuscation.kAnonymity}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          obfuscation: { ...prev.obfuscation, kAnonymity: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="bg-gradient-primary">
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Rules List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Rules ({rules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No privacy rules created yet</p>
              <p className="text-sm mb-4">Create your first rule to define data protection policies</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                Create Rule
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => {
                const dataset = datasets.find(d => d.id === rule.datasetId);
                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-cyber shadow-glow">
                        <Shield className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Dataset: {dataset?.name || 'Unknown'}</span>
                          <span>{rule.fields.length} fields</span>
                          <span>TTL: {rule.ttlMinutes}m</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {rule.tags?.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {rule.obfuscation?.dropPII && (
                            <Badge variant="secondary" className="text-xs">PII Protected</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRule(rule)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Rule Details: {rule.name}</DialogTitle>
                            <DialogDescription>
                              Configuration and settings
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium">Dataset:</span>
                                <p>{dataset?.name || 'Unknown'}</p>
                              </div>
                              <div>
                                <span className="font-medium">TTL:</span>
                                <p>{rule.ttlMinutes} minutes</p>
                              </div>
                              <div className="col-span-2">
                                <span className="font-medium">Description:</span>
                                <p>{rule.description || 'No description'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <span className="font-medium">Fields:</span>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {rule.fields.map(field => (
                                  <Badge key={field} variant="outline">{field}</Badge>
                                ))}
                              </div>
                            </div>

                            {rule.obfuscation && (
                              <div>
                                <span className="font-medium">Privacy Protection:</span>
                                <div className="mt-2 p-3 bg-accent/30 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Drop PII:</span>
                                    <Badge variant={rule.obfuscation.dropPII ? "default" : "outline"}>
                                      {rule.obfuscation.dropPII ? "Yes" : "No"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center justify-between text-sm">
                                    <span>Noise Level:</span>
                                    <Badge variant="outline">{rule.obfuscation.noiseLevel}</Badge>
                                  </div>
                                  {rule.obfuscation.kAnonymity > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                      <span>K-Anonymity:</span>
                                      <Badge variant="outline">{rule.obfuscation.kAnonymity}</Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}