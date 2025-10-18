// scripts/sparkline.js - Reusable sparkline chart helper using Chart.js
import Chart from "chart.js/auto";

function withAlpha(color, alpha) {
  if (!color) return `rgba(56, 200, 255, ${alpha})`;

  const hexMatch = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    const intVal = parseInt(hex, 16);
    const r = (intVal >> 16) & 255;
    const g = (intVal >> 8) & 255;
    const b = intVal & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgbMatch = color.trim().match(/^rgb\s*\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\)$/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return color;
}

export class SparklineChart {
  constructor(canvas, options = {}) {
    if (!canvas) {
      throw new Error("SparklineChart requires a canvas element.");
    }

    this.canvas = canvas;
    this.series = [];
    this.options = {
      colorUp: options.colorUp ?? "#38c8ff",
      colorDown: options.colorDown ?? "#f87171",
      backgroundAlpha: options.backgroundAlpha ?? 0.18,
      tension: options.tension ?? 0.35,
      tooltipLabel: options.tooltipLabel ?? "Keys / min",
    };

    this.chart = new Chart(this.canvas, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: this.options.tooltipLabel,
            data: [],
            fill: "start",
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 3,
            pointHoverBorderWidth: 1,
            pointHoverBackgroundColor: this.options.colorUp,
            pointHoverBorderColor: "#111827",
            segment: {
              borderCapStyle: "round",
            },
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 200,
        },
        elements: {
          line: {
            tension: this.options.tension,
            borderJoinStyle: "round",
          },
          point: {
            hitRadius: 8,
          },
        },
        layout: {
          padding: 0,
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
            beginAtZero: true,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            mode: "index",
            intersect: false,
            displayColors: false,
            backgroundColor: "rgba(17, 24, 39, 0.92)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            borderWidth: 1,
            callbacks: {
              title: (items) => {
                if (!items?.length) return "";
                const idx = items[0].dataIndex;
                const point = this.series?.[idx];
                if (!point) return "";
                return this._formatTime(point.timestamp);
              },
              label: (item) => {
                const point = this.series?.[item.dataIndex];
                const value = point?.value ?? item.parsed?.y ?? 0;
                return `${this.options.tooltipLabel}: ${value}`;
              },
            },
          },
        },
      },
    });
  }

  update(series = []) {
    if (!Array.isArray(series)) return;
    this.series = series.map((point) => ({
      timestamp: point.timestamp,
      value: Number.isFinite(point.value) ? point.value : Number(point.value) || 0,
    }));

    const dataset = this.chart.data.datasets[0];
    const labels = this.series.map((point) => point.timestamp);
    const data = this.series.map((point) => point.value);

    const rising =
      this.series.length > 1
        ? this.series[this.series.length - 1].value >= this.series[0].value
        : true;
    const borderColor = rising ? this.options.colorUp : this.options.colorDown;
    const gradient = this._buildGradient(borderColor);

    dataset.data = data;
    dataset.borderColor = borderColor;
    dataset.backgroundColor = gradient;
    dataset.pointHoverBackgroundColor = borderColor;
    this.chart.data.labels = labels;

    if (data.length) {
      const max = Math.max(...data);
      const min = Math.min(...data);
      this.chart.options.scales.y.suggestedMax = max + 2;
      this.chart.options.scales.y.suggestedMin = Math.max(min - 2, 0);
    } else {
      this.chart.options.scales.y.suggestedMax = 5;
      this.chart.options.scales.y.suggestedMin = 0;
    }

    this.chart.update("none");
  }

  destroy() {
    this.chart?.destroy();
  }

  _buildGradient(borderColor) {
    const ctx = this.chart.ctx;
    const height = this.canvas.height || this.canvas.clientHeight || 60;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, withAlpha(borderColor, this.options.backgroundAlpha));
    gradient.addColorStop(1, withAlpha(borderColor, 0));
    return gradient;
  }

  _formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

export default SparklineChart;
