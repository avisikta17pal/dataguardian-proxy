import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Database, Shield, Eye, Key } from "lucide-react";
import { useDatasetStore, useRuleStore, useStreamStore, useTokenStore } from "@/stores";
import { useNavigate } from "react-router-dom";
import { Stream, Token } from "@/types";
import toast from "react-hot-toast";

export default function StreamNew() {
  const navigate = useNavigate();
  const { datasets } = useDatasetStore();
  const { rules } = useRuleStore();
  const { addStream } = useStreamStore();
  const { addToken } = useTokenStore();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    datasetId: '',
    ruleId: '',
    description: '',
    expiryHours: '24',
    generateToken: true,
    tokenName: '',
    oneTimeToken: false
  });

  const steps = [
    { number: 1, title: "Select Data", icon: Database },
    { number: 2, title: "Apply Rules", icon: Shield },
    { number: 3, title: "Preview", icon: Eye },
    { number: 4, title: "Generate Token", icon: Key }
  ];

  const selectedDataset = datasets.find(d => d.id === formData.datasetId);
  const selectedRule = rules.find(r => r.id === formData.ruleId);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = () => {
    if (!formData.name || !formData.datasetId || !formData.ruleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expiryHours));

    const stream: Stream = {
      id: crypto.randomUUID(),
      name: formData.name,
      ruleId: formData.ruleId,
      status: 'active',
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      datasetName: formData.datasetId,
      ruleName: selectedRule?.name,
      accessCount: 0
    };

    addStream(stream);

    if (formData.generateToken) {
      const token: Token = {
        id: crypto.randomUUID(),
        streamId: stream.id,
        token: 'dgp_' + crypto.randomUUID().replace(/-/g, '').substring(0, 32),
        scope: ['read'],
        expiresAt: expiresAt.toISOString(),
        oneTime: formData.oneTimeToken,
        createdAt: new Date().toISOString(),
        name: formData.tokenName || `${formData.name} Token`,
        accessCount: 0
      };

      addToken(token);
    }

    toast.success('Stream created successfully!');
    navigate('/streams');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.datasetId && formData.name;
      case 2:
        return formData.ruleId;
      case 3:
        return true;
      case 4:
        return !formData.generateToken || formData.tokenName;
      default:
        return false;
    }
  };

  const mockPreviewData = [
    { timestamp: '2024-01-01', aggregated_steps: 12547, avg_heart_rate: 72 },
    { timestamp: '2024-01-02', aggregated_steps: 8932, avg_heart_rate: 68 },
    { timestamp: '2024-01-03', aggregated_steps: 15623, avg_heart_rate: 78 },
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/streams')}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Streams
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Create New Stream
          </h1>
          <p className="text-muted-foreground">
            Set up a time-limited, filtered data stream
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 ${
              currentStep >= step.number 
                ? 'bg-gradient-primary text-primary-foreground shadow-glow' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <step.icon className="h-5 w-5" />
            </div>
            <div className="ml-2 hidden sm:block">
              <p className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-1 mx-4 rounded transition-all duration-200 ${
                currentStep > step.number ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6">
          {/* Step 1: Select Data */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Dataset and Name Your Stream</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="streamName">Stream Name *</Label>
                    <Input
                      id="streamName"
                      placeholder="e.g., Health Insights Stream"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dataset">Source Dataset *</Label>
                    <Select value={formData.datasetId} onValueChange={(value) => setFormData({...formData, datasetId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasets.map(dataset => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <span>{dataset.name}</span>
                              <Badge variant="outline">{dataset.rows} rows</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the purpose of this stream..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {selectedDataset && (
                <div className="p-4 bg-accent/30 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Dataset: {selectedDataset.name}</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Rows:</span>
                      <p className="font-mono">{selectedDataset.rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Columns:</span>
                      <p className="font-mono">{selectedDataset.schema.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-mono">{new Date(selectedDataset.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Apply Rules */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Privacy Rule</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rule">Privacy Rule *</Label>
                    <Select value={formData.ruleId} onValueChange={(value) => setFormData({...formData, ruleId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a privacy rule" />
                      </SelectTrigger>
                      <SelectContent>
                        {rules.filter(rule => rule.datasetId === formData.datasetId).map(rule => (
                          <SelectItem key={rule.id} value={rule.id}>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              <span>{rule.name}</span>
                              <Badge variant="outline">{rule.fields.length} fields</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {rules.filter(rule => rule.datasetId === formData.datasetId).length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        No rules found for this dataset. Create a rule first.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="expiry">Expiry Time</Label>
                    <Select value={formData.expiryHours} onValueChange={(value) => setFormData({...formData, expiryHours: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hour</SelectItem>
                        <SelectItem value="6">6 hours</SelectItem>
                        <SelectItem value="24">24 hours</SelectItem>
                        <SelectItem value="72">3 days</SelectItem>
                        <SelectItem value="168">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {selectedRule && (
                <div className="p-4 bg-accent/30 rounded-lg">
                  <h4 className="font-medium mb-2">Selected Rule: {selectedRule.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Fields:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRule.fields.map(field => (
                          <Badge key={field} variant="outline">{field}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">TTL:</span>
                      <p>{selectedRule.ttlMinutes} minutes</p>
                    </div>
                    {selectedRule.description && (
                      <div>
                        <span className="text-muted-foreground">Description:</span>
                        <p>{selectedRule.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Preview Filtered Data</h3>
                <p className="text-muted-foreground mb-4">
                  This is a preview of how your data will look after applying the selected rule
                </p>
                
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 border-b border-border/50">
                    <span className="text-sm font-medium">Sample Output</span>
                  </div>
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/30">
                            {Object.keys(mockPreviewData[0]).map(key => (
                              <th key={key} className="text-left p-2 font-medium">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {mockPreviewData.map((row, index) => (
                            <tr key={index} className="border-b border-border/20">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="p-2 font-mono">{value}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <h4 className="font-medium text-success">Privacy Protected</h4>
                    <p className="text-sm text-muted-foreground">PII fields removed, data aggregated</p>
                  </div>
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <h4 className="font-medium text-primary">Time-Limited</h4>
                    <p className="text-sm text-muted-foreground">Expires in {formData.expiryHours} hours</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Generate Token */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Generate Access Token</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="generateToken"
                      checked={formData.generateToken}
                      onCheckedChange={(checked) => setFormData({...formData, generateToken: Boolean(checked)})}
                    />
                    <Label htmlFor="generateToken">Generate access token for this stream</Label>
                  </div>

                  {formData.generateToken && (
                    <>
                      <div>
                        <Label htmlFor="tokenName">Token Name *</Label>
                        <Input
                          id="tokenName"
                          placeholder="e.g., Mobile App Token"
                          value={formData.tokenName}
                          onChange={(e) => setFormData({...formData, tokenName: e.target.value})}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="oneTime"
                          checked={formData.oneTimeToken}
                          onCheckedChange={(checked) => setFormData({...formData, oneTimeToken: Boolean(checked)})}
                        />
                        <Label htmlFor="oneTime">One-time use token</Label>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 bg-accent/30 rounded-lg mt-6">
                  <h4 className="font-medium mb-2">Stream Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stream:</span>
                      <p>{formData.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Dataset:</span>
                      <p>{selectedDataset?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rule:</span>
                      <p>{selectedRule?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expires:</span>
                      <p>In {formData.expiryHours} hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < 4 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={!canProceed()}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-200"
          >
            Create Stream
          </Button>
        )}
      </div>
    </div>
  );
}