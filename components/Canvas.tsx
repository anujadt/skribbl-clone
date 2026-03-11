"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { StrokeData } from "@/types/game";
import { Eraser, Trash2 } from "lucide-react";

interface CanvasProps {
  isDrawer: boolean;
}

const COLORS = ["#000000", "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#FFFFFF"];
const SIZES = [2, 5, 10, 20];

export default function Canvas({ isDrawer }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(5);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize canvas to fit container
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Save current content
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext("2d");
        if (tCtx) tCtx.drawImage(canvas, 0, 0);

        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Restore content
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(tempCanvas, 0, 0);
      }
    };
    
    // Initial size setup
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
    
    window.addEventListener("resize", resizeCanvas);

    const onClearCanvas = () => {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    socket.on("canvas_cleared", onClearCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off("canvas_cleared", onClearCanvas);
    };
  }, []);

  const drawLine = (x0: number, y0: number, x1: number, y1: number, strokeColor: string, strokeSize: number, emit: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.closePath();

    if (!emit) return;

    const w = canvas.width;
    const h = canvas.height;

    getSocket().emit("draw_stroke", {
      x0: x0 / w,
      y0: y0 / h,
      x1: x1 / w,
      y1: y1 / h,
      color: strokeColor,
      size: strokeSize,
    });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
       return {
         x: e.touches[0].clientX - rect.left,
         y: e.touches[0].clientY - rect.top
       };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    const pos = getCoordinates(e);
    lastPos.current = pos;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDrawing || !isDrawer || !lastPos.current) return;
    e.preventDefault(); 
    
    const currentPos = getCoordinates(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    drawLine(
      lastPos.current.x, lastPos.current.y,
      currentPos.x, currentPos.y,
      color,
      size,
      true
    );
    
    lastPos.current = currentPos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
  };

  useEffect(() => {
     window.addEventListener("mouseup", stopDrawing);
     window.addEventListener("touchend", stopDrawing);
     return () => {
       window.removeEventListener("mouseup", stopDrawing);
       window.removeEventListener("touchend", stopDrawing);
     }
  }, [isDrawing]);

  useEffect(() => {
    const socket = getSocket();
    const handleRemoteStroke = (data: StrokeData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      drawLine(
        data.x0 * w, data.y0 * h,
        data.x1 * w, data.y1 * h,
        data.color, data.size,
        false
      );
    };
    socket.off("receive_stroke"); 
    socket.on("receive_stroke", handleRemoteStroke);
  }, []);

  const clearCanvas = () => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    getSocket().emit("clear_canvas");
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden" ref={containerRef}>
      <div className={`flex-grow relative touch-none ${isDrawer ? 'cursor-crosshair' : 'cursor-default'}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          className="absolute inset-0 w-full h-full bg-white"
        />
        {!isDrawer && (
          <div className="absolute inset-0 w-full h-full cursor-not-allowed" />
        )}
      </div>
      
      {isDrawer && (
        <div className="h-16 border-t border-gray-100 bg-gray-50 flex items-center justify-between px-4 gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setColor(c); if(c === "#FFFFFF") setSize(20); else if(color==="#FFFFFF") setSize(5); }}
                className={`w-8 h-8 rounded-full border-2 transition-transform shadow-sm ${color === c ? 'scale-125 border-gray-400 z-10' : 'border-gray-200 hover:scale-110'}`}
                style={{ backgroundColor: c }}
                title={c === "#FFFFFF" ? "Eraser" : "Color"}
              />
            ))}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
             {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${size === s ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-200 text-gray-400'}`}
                >
                  <div className="rounded-full bg-current" style={{ width: s, height: s }} />
                </button>
             ))}
             <div className="w-px h-8 bg-gray-300 mx-1" />
             <button onClick={clearCanvas} className="p-2 justify-center flex items-center gap-2 rounded-xl hover:bg-red-100 text-red-500 transition-colors font-medium text-sm md:text-base pr-4" title="Clear Canvas">
               <Trash2 className="w-5 h-5" />
               <span className="hidden md:inline">Clear</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
