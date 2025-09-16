import { useState } from "react";
import { Task, Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Check, Plus } from "lucide-react";

interface SequentialTaskFormProps {
  courses: Course[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onAddCourse: (course: Omit<Course, 'id'>) => void;
  onClose: () => void;
}

export function SequentialTaskForm({ courses, onAddTask, onAddCourse, onClose }: SequentialTaskFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    estHours: '',
    dueDate: '',
    priority: 'medium' as Task['priority'],
    difficulty: '3' as string,
  });
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  const handleAddCourse = () => {
    if (!newCourseName.trim()) return;
    
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newCourse = {
      name: newCourseName.trim(),
      color: randomColor
    };
    
    onAddCourse(newCourse);
    setFormData({ ...formData, courseId: Date.now().toString() });
    setNewCourseName('');
    setShowAddCourse(false);
    setCurrentStep(2);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.courseId || !formData.dueDate || !formData.estHours) {
      return;
    }

    const dueAt = new Date(`${formData.dueDate}T23:59`);
    
    onAddTask({
      title: formData.title,
      courseId: formData.courseId,
      type: 'reading',
      dueAt,
      estHours: parseFloat(formData.estHours),
      difficulty: parseInt(formData.difficulty) as Task['difficulty'],
      priority: formData.priority,
      notes: '',
      status: 'open'
    });
    
    onClose();
  };

  const steps = [
    {
      question: "What needs to be done?",
      placeholder: "Enter your task...",
      component: (
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter your task..."
          className="text-center text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && formData.title && handleNext()}
        />
      ),
      isValid: () => formData.title.trim() !== ''
    },
    {
      question: "Which course is this for?",
      component: showAddCourse ? (
        <div className="space-y-4">
          <Input
            placeholder="Course name"
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            className="text-center text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50"
            onKeyDown={(e) => e.key === 'Enter' && newCourseName && handleAddCourse()}
            autoFocus
          />
          <div className="flex gap-2 justify-center">
            <Button onClick={handleAddCourse} size="sm" disabled={!newCourseName.trim()}>
              <Check className="w-4 h-4" />
            </Button>
            <Button onClick={() => setShowAddCourse(false)} variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
            <SelectTrigger className="text-center border-0 bg-transparent focus:ring-0 focus:outline-none">
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: course.color }} />
                    {course.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowAddCourse(true)}
            variant="ghost"
            size="sm"
            className="text-muted-foreground/70 hover:text-foreground"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add new course
          </Button>
        </div>
      ),
      isValid: () => formData.courseId !== '' || showAddCourse
    },
    {
      question: "How many hours will this take?",
      component: (
        <Input
          type="number"
          step="0.5"
          min="0.5"
          value={formData.estHours}
          onChange={(e) => setFormData({ ...formData, estHours: e.target.value })}
          placeholder="e.g. 2.5"
          className="text-center text-lg border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/50"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && formData.estHours && handleNext()}
        />
      ),
      isValid: () => formData.estHours !== '' && parseFloat(formData.estHours) > 0
    },
    {
      question: "When is this due?",
      component: (
        <Input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className="text-center text-lg border-0 bg-transparent focus:ring-0 focus:outline-none"
          min={new Date().toISOString().split('T')[0]}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && formData.dueDate && handleNext()}
        />
      ),
      isValid: () => formData.dueDate !== ''
    },
    {
      question: "How important is this?",
      component: (
        <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as Task['priority'] })}>
          <SelectTrigger className="text-center border-0 bg-transparent focus:ring-0 focus:outline-none">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low priority</SelectItem>
            <SelectItem value="medium">Medium priority</SelectItem>
            <SelectItem value="high">High priority</SelectItem>
          </SelectContent>
        </Select>
      ),
      isValid: () => true // Priority has a default value
    },
    {
      question: "How difficult is this task?",
      component: (
        <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
          <SelectTrigger className="text-center border-0 bg-transparent focus:ring-0 focus:outline-none">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Very Easy</SelectItem>
            <SelectItem value="2">Easy</SelectItem>
            <SelectItem value="3">Medium</SelectItem>
            <SelectItem value="4">Hard</SelectItem>
            <SelectItem value="5">Very Hard</SelectItem>
          </SelectContent>
        </Select>
      ),
      isValid: () => true // Difficulty has a default value
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-gradient-calm flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-12">
        {/* Progress indicator */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="text-center space-y-8">
          <h2 className="text-2xl font-light text-foreground animate-fade-in">
            {currentStepData.question}
          </h2>

          {/* Input area */}
          <div className="animate-fade-in">
            {currentStepData.component}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={handleBack}
            variant="ghost"
            size="sm"
            className={`transition-opacity duration-300 ${
              currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-muted-foreground/50 hover:text-muted-foreground"
          >
            Cancel
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!currentStepData.isValid()}
              className="transition-all duration-300 hover:scale-105"
            >
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!currentStepData.isValid()}
              className="transition-all duration-300 hover:scale-105"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}