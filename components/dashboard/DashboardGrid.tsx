"use client"

import { useState } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Save, Plus, X, Move, RotateCcw, Maximize2, Minimize2 } from "lucide-react"
import { WIDGET_REGISTRY, DashboardData, WidgetId, DEFAULT_LAYOUT, WIDGET_SIZES } from "./WidgetRegistry"
import { saveDashboardLayout } from "@/app/actions/user"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface DashboardGridProps {
    initialLayout: { id: string; type: WidgetId; size?: string }[]
    data: DashboardData
}

function SortableItem(props: {
    id: string;
    widgetType: WidgetId;
    isEditing: boolean;
    data: DashboardData;
    size?: string;
    onRemove: (id: string) => void;
    onResize: (id: string, size: string) => void;
    index: number;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition, // Disable transition during drag
        opacity: isDragging ? 0.8 : 1,
        // We allow auto touch action on the container so scrolling works
        // The drag handle will capture the drag events
        touchAction: 'auto'
    }

    const WidgetConfig = WIDGET_REGISTRY[props.widgetType]
    const WidgetComponent = WidgetConfig.component
    const currentSize = props.size || WidgetConfig.defaultSize
    const visibilityClass = WidgetConfig.mobileVisible ? "" : "hidden md:block"

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${currentSize} ${visibilityClass} relative group h-full`}
        >
            {/* Top-right controls */}
            {props.isEditing && (
                <div className="absolute top-2 right-2 z-[60] flex gap-1 bg-background/95 backdrop-blur-sm p-1 rounded-lg border shadow-md">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const currentIndex = WIDGET_SIZES.findIndex(s => s.value === currentSize);
                            const nextIndex = (currentIndex + 1) % WIDGET_SIZES.length;
                            props.onResize(props.id, WIDGET_SIZES[nextIndex].value);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-md h-7 w-7 flex items-center justify-center cursor-pointer transition-colors"
                        title="Resize Widget"
                    >
                        <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            props.onRemove(props.id)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md h-7 w-7 flex items-center justify-center cursor-pointer transition-colors"
                        title="Remove Widget"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Widget content - no motion during drag */}
            <div className={`h-full rounded-xl overflow-hidden ${props.isEditing ? 'border-2 border-dashed border-primary/30 bg-accent/5' : ''}`}>
                <div className={props.isEditing ? "pointer-events-none h-full" : "h-full"}>
                    <WidgetComponent data={props.data} />
                </div>
            </div>

            {/* Drag handle overlay - only in edit mode */}
            {props.isEditing && (
                <div
                    className="absolute inset-0 flex items-center justify-center z-50 cursor-grab active:cursor-grabbing opacity-0 hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-[0.5px] rounded-xl"
                    style={{ touchAction: 'none' }} // Prevent scrolling when touching the drag handle
                    {...attributes}
                    {...listeners}
                >
                    <div className="bg-background/90 px-4 py-2 rounded-full shadow-lg border-2 border-primary/20 flex items-center gap-2">
                        <Move className="h-5 w-5 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Drag to move</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export function DashboardGrid({ initialLayout, data }: DashboardGridProps) {
    const [layout, setLayout] = useState(initialLayout)
    const [isEditing, setIsEditing] = useState(false)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require 5px movement to start drag (prevents accidental drags)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = (event: any) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setLayout((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }

        setActiveId(null)
    }

    const handleSave = async () => {
        setIsSaving(true)
        await saveDashboardLayout(layout)
        setIsSaving(false)
        setIsEditing(false)
    }

    const handleRemove = (idToRemove: string) => {
        setLayout(items => items.filter(item => item.id !== idToRemove))
    }

    const handleResize = (id: string, newSize: string) => {
        setLayout(items => items.map(item =>
            item.id === id ? { ...item, size: newSize } : item
        ))
    }

    const handleAddWidget = (type: WidgetId) => {
        const newId = `${type}-${Date.now()}`
        setLayout(items => [...items, { id: newId, type }])
    }

    const availableWidgets = Object.entries(WIDGET_REGISTRY).map(([key, config]) => ({
        id: key as WidgetId,
        title: config.title
    }))

    const handleReset = async () => {
        if (confirm("Are you sure you want to reset to the default layout?")) {
            // Cast DEFAULT_LAYOUT to the correct type to avoid TS errors
            const defaultLayoutTyped = DEFAULT_LAYOUT as { id: string; type: WidgetId; size?: string }[];
            setLayout(defaultLayoutTyped);
            // Auto-save the reset layout
            setIsSaving(true);
            await saveDashboardLayout(defaultLayoutTyped);
            setIsSaving(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end items-center">
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Plus className="h-4 w-4" /> Add Widget
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Widgets</DialogTitle>
                                        <DialogDescription>
                                            Select widgets to add to your dashboard.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                                        {availableWidgets.map((widget) => (
                                            <div key={widget.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent cursor-pointer transition-colors" onClick={() => handleAddWidget(widget.id)}>
                                                <div className="flex-1">
                                                    <Label className="cursor-pointer font-medium">{widget.title}</Label>
                                                </div>
                                                <Plus className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Button onClick={handleReset} variant="outline" size="sm" disabled={isSaving} className="gap-2">
                                <RotateCcw className="h-4 w-4" /> Reset
                            </Button>

                            <Button onClick={handleSave} size="sm" disabled={isSaving}>
                                {isSaving ? "Saving..." : <><Save className="h-4 w-4 mr-2" /> Save Layout</>}
                            </Button>
                        </>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                            <LayoutGrid className="h-4 w-4 mr-2" /> Customize
                        </Button>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={layout.map(l => l.id)} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 pb-10">
                        {layout.filter(item => WIDGET_REGISTRY[item.type]).map((item, index) => (
                            <SortableItem
                                key={item.id}
                                id={item.id}
                                widgetType={item.type}
                                size={item.size}
                                isEditing={isEditing}
                                data={data}
                                onRemove={handleRemove}
                                onResize={handleResize}
                                index={index}
                            />
                        ))}
                    </div>
                </SortableContext>

                <DragOverlay
                    adjustScale={true}
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
                        duration: 300,
                        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                    }}
                >
                    {(() => {
                        const activeItem = layout.find(item => item.id === activeId);
                        if (!activeItem || !activeId) return null;

                        const WidgetConfig = WIDGET_REGISTRY[activeItem.type];
                        if (!WidgetConfig) return null;

                        const WidgetComponent = WidgetConfig.component;

                        return (
                            <div className="h-full w-full opacity-90 scale-105 shadow-2xl rounded-xl rotate-2 transition-all cursor-grabbing pointer-events-none">
                                <div className="bg-background/80 backdrop-blur-sm rounded-xl h-full w-full overflow-hidden border border-primary/20">
                                    <WidgetComponent data={data} />
                                </div>
                            </div>
                        )
                    })()}
                </DragOverlay>

            </DndContext>
        </div>
    )
}
