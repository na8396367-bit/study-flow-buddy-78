import { useState } from "react";
import { Task, Course } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus } from "lucide-react";

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
          placeholder="Type here..."
          className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30 w-full"
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && formData.title && handleNext()}
        />
      ),
      isValid: () => formData.title.trim() !== ''
    },
    {
      question: "Which course is this for?",
      component: showAddCourse ? (
        <div className="space-y-6">
          <Input
            placeholder="Type course name..."
            value={newCourseName}
            onChange={(e) => setNewCourseName(e.target.value)}
            className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30"
            onKeyDown={(e) => e.key === 'Enter' && newCourseName && handleAddCourse()}
            autoFocus
          />
          <div className="flex justify-center space-x-6">
            <button onClick={handleAddCourse} disabled={!newCourseName.trim()} className="text-primary/70 hover:text-primary disabled:text-muted-foreground/30 text-sm font-light">
              add course
            </button>
            <button onClick={() => setShowAddCourse(false)} className="text-muted-foreground/50 hover:text-muted-foreground text-sm font-light">
              cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Select value={formData.courseId} onValueChange={(value) => setFormData({ ...formData, courseId: value })}>
            <SelectTrigger className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none">
              <SelectValue placeholder="Choose..." />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: course.color }} />
                    {course.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setShowAddCourse(true)}
            className="text-muted-foreground/40 hover:text-muted-foreground/70 text-sm font-light"
          >
            + new course
          </button>
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
          placeholder="2.5"
          className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/30 w-32 mx-auto"
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
          className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none w-48 mx-auto"
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
          <SelectTrigger className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none w-48 mx-auto">
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">low priority</SelectItem>
            <SelectItem value="medium">medium priority</SelectItem>
            <SelectItem value="high">high priority</SelectItem>
          </SelectContent>
        </Select>
      ),
      isValid: () => true // Priority has a default value
    },
    {
      question: "How difficult is this task?",
      component: (
        <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
          <SelectTrigger className="text-center text-xl font-light border-0 bg-transparent focus:ring-0 focus:outline-none w-48 mx-auto">
            <SelectValue placeholder="Choose..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">very easy</SelectItem>
            <SelectItem value="2">easy</SelectItem>
            <SelectItem value="3">medium</SelectItem>
            <SelectItem value="4">hard</SelectItem>
            <SelectItem value="5">very hard</SelectItem>
          </SelectContent>
        </Select>
      ),
      isValid: () => true // Difficulty has a default value
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="w-full max-w-lg px-8">
        {/* Minimal progress indicator */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="text-xs text-muted-foreground/50 font-light">
            {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          ×
        </button>

        {/* Question and input */}
        <div className="text-center space-y-12">
          <h1 className="text-3xl font-extralight text-foreground/90 leading-relaxed">
            {currentStepData.question}
          </h1>

          <div className="w-full">
            {currentStepData.component}
          </div>

          {/* Navigation */}
          <div className="flex justify-center space-x-8 pt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors text-sm font-light"
              >
                back
              </button>
            )}

            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={!currentStepData.isValid()}
                className="text-primary hover:text-primary/80 disabled:text-muted-foreground/30 transition-colors text-sm font-light"
              >
                create task
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!currentStepData.isValid()}
                className="text-primary hover:text-primary/80 disabled:text-muted-foreground/30 transition-colors text-sm font-light"
              >
                →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}