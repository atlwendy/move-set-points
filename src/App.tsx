import "./styles.css";
import { useEffect, useRef } from "react";
import { useDidUpdate } from "rooks";
import useMousePosition from "./useMousePosition";

export default function App() {
  let canvas = useRef<HTMLCanvasElement | null>(null);

  const [coords, handleCoords] = useMousePosition(true);
  const ctx = canvas?.current?.getContext("2d");
  const mouse = {
    x: 0,
    y: 0,
    button: false,
    lastX: 0,
    lastY: 0,
    lx: 0,
    ly: 0,
    update: true
  };

  const mouseEvents = (e) => {
    const bounds = canvas?.current?.getBoundingClientRect();
    mouse.x = e.pageX - bounds?.left;
    mouse.y = e.pageY - bounds?.top;
    mouse.button =
      e.type === "mousedown"
        ? true
        : e.type === "mouseup"
        ? false
        : mouse.button;
    mouse.update = true;
  };

  const point = (x, y) => ({ x, y });
  const poly = () => ({
    points: [],
    addPoint(p) {
      this.points.push(point(p.x, p.y));
    },
    draw() {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "blue";
      ctx.beginPath();

      for (const p of this.points) {
        ctx.lineTo(p.x, p.y);
      }

      for (const p of this.points) {
        ctx.moveTo(p.x + 4, p.y);
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.stroke();
    },
    closest(pos, dist = 8) {
      var i = 0,
        index = -1;
      dist *= dist;
      for (const p of this.points) {
        var x = pos.x - p.x;
        var y = pos.y - p.y;
        var d2 = x * x + y * y;
        if (d2 < dist) {
          dist = d2;
          index = i;
        }
        i++;
      }
      if (index > -1) {
        return this.points[index];
      }
    }
  });
  const drawCircle = (pos, color = "red", size = 8) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
    ctx.stroke();
  };
  const polygon = poly();
  var activePoint, cursor;
  var dragging = false;

  const update = () => {
    if (mouse.update) {
      cursor = "crosshair";
      ctx?.clearRect(0, 0, canvas.current.width, canvas.current.height);
      if (!dragging) {
        activePoint = polygon.closest(mouse);
      }
      if (activePoint === undefined && mouse.button) {
        polygon.addPoint(mouse);

        mouse.button = false;
      } else if (activePoint) {
        if (mouse.button) {
          if (dragging) {
            activePoint.x += mouse.x - mouse.lx;
            activePoint.y += mouse.y - mouse.ly;
          } else {
            dragging = true;
          }
        } else {
          dragging = false;
        }
      }
      polygon.draw();
      if (activePoint) {
        drawCircle(activePoint);
        cursor = "move";
      }

      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      if (canvas.current) {
        canvas.current.style.cursor = cursor;
      }
      mouse.update = false;
    }
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
    requestAnimationFrame(update);
  };

  useEffect(() => {
    if (canvas && ctx) {
      update();
    }
  }, [canvas, ctx]);

  useDidUpdate(() => {
    ["mousedown", "mouseup", "mousemove"].forEach((name) => {
      canvas.current.addEventListener(name, mouseEvents);
    });
  });

  const clearCanvas = () => {
    ctx?.clearRect(0, 0, canvas.current.width, canvas.current.height);
    ["mousedown", "mouseup", "mousemove"].forEach((name) => {
      window.removeEventListener(name, mouseEvents);
    });
  };
  return (
    <>
      <h1>Draw and edit lines with set points</h1>
      <canvas
        ref={canvas}
        width="400"
        height="350"
        style={{ border: "2px solid black" }}
      ></canvas>
      <button onClick={() => clearCanvas()}>CLEAR</button>
    </>
  );
}
