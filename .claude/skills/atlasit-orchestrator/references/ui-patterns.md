# UI/UX Patterns Reference

## Component Architecture

```
frontend/src/
├── components/
│   ├── ui/              # Primitive components (Button, Card, Input)
│   ├── dashboard/       # Dashboard-specific widgets
│   ├── map/             # Map-related components
│   ├── charts/          # Data visualization
│   └── layout/          # Layout components (Sidebar, Header)
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (cn, formatters)
├── types/               # TypeScript interfaces
└── pages/               # Route-level components
```

## Design System Tokens

```typescript
// TailwindCSS extended theme (tailwind.config.ts)
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          500: "#3b82f6",
          900: "#1e3a5a",
        },
        tesla: {
          red: "#cc0000",
          dark: "#171a20",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
};
```

## Primitive Components

### Button

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-white hover:bg-brand-600",
        secondary:
          "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
        ghost: "hover:bg-gray-100 dark:hover:bg-gray-800",
        danger: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </button>
  );
}
```

### Card

```tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  const paddingStyles = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-white shadow-sm border border-gray-100",
        "dark:bg-gray-800 dark:border-gray-700",
        paddingStyles[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
```

## Dashboard Widgets

### Metric Card (with loading/error states)

```tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  loading?: boolean;
  error?: string;
}

export function MetricCard({ title, value, unit, icon, trend, loading, error }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-4 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <div className="text-red-500 text-sm">{error}</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        {icon && <span className="text-gray-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {trend && (
        <div
          className={cn(
            "mt-2 flex items-center text-sm",
            trend.value >= 0 ? "text-green-500" : "text-red-500",
          )}
        >
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          <span className="ml-1 text-gray-500">{trend.label}</span>
        </div>
      )}
    </Card>
  );
}
```

### Battery Status Widget

```tsx
interface BatteryStatusProps {
  level: number;
  range: number;
  isCharging: boolean;
  chargerPower?: number;
  targetLevel?: number;
}

export function BatteryStatus({
  level,
  range,
  isCharging,
  chargerPower,
  targetLevel,
}: BatteryStatusProps) {
  const getBatteryColor = (level: number) => {
    if (level <= 20) return "bg-red-500";
    if (level <= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Battery</h3>
        {isCharging && (
          <span className="flex items-center text-green-500 text-sm">
            <BoltIcon className="h-4 w-4 mr-1" />
            Charging {chargerPower && `@ ${chargerPower}kW`}
          </span>
        )}
      </div>

      {/* Battery bar */}
      <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", getBatteryColor(level))}
          style={{ width: `${level}%` }}
        />
        {targetLevel && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: `${targetLevel}%` }}
          />
        )}
        <span className="absolute inset-0 flex items-center justify-center font-bold text-white mix-blend-difference">
          {level}%
        </span>
      </div>

      <div className="mt-3 flex justify-between text-sm text-gray-500">
        <span>{range} mi range</span>
        {targetLevel && <span>Target: {targetLevel}%</span>}
      </div>
    </Card>
  );
}
```

## Map Components

### Route Map

```tsx
import Map, { Source, Layer, Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface RouteMapProps {
  route: GeoJSON.FeatureCollection;
  currentPosition?: { lat: number; lng: number };
  waypoints?: Waypoint[];
  onMarkerClick?: (id: string) => void;
}

export function RouteMap({ route, currentPosition, waypoints, onMarkerClick }: RouteMapProps) {
  const [viewport, setViewport] = useState({
    latitude: 39.8283,
    longitude: -98.5795,
    zoom: 4,
  });

  const routeLayerStyle: LayerProps = {
    id: "route",
    type: "line",
    paint: {
      "line-color": "#3b82f6",
      "line-width": 4,
      "line-opacity": 0.8,
    },
  };

  return (
    <div className="h-[500px] rounded-xl overflow-hidden">
      <Map
        {...viewport}
        onMove={(evt) => setViewport(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Route line */}
        <Source type="geojson" data={route}>
          <Layer {...routeLayerStyle} />
        </Source>

        {/* Current position */}
        {currentPosition && (
          <Marker latitude={currentPosition.lat} longitude={currentPosition.lng}>
            <div className="relative">
              <div className="h-4 w-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
              <div className="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping" />
            </div>
          </Marker>
        )}

        {/* Waypoints */}
        {waypoints?.map((wp) => (
          <Marker
            key={wp.id}
            latitude={wp.lat}
            longitude={wp.lng}
            onClick={() => onMarkerClick?.(wp.id)}
          >
            <WaypointPin type={wp.type} />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
```

## Charts (Recharts)

### Efficiency Chart

```tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface EfficiencyChartProps {
  data: { date: string; efficiency: number; target: number }[];
}

export function EfficiencyChart({ data }: EfficiencyChartProps) {
  return (
    <Card>
      <h3 className="font-semibold mb-4">Energy Efficiency</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fill: "#9ca3af", fontSize: 12 }} unit=" Wh/mi" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="efficiency"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Actual"
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#10b981"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
              name="Target"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
```

## Layout Patterns

### Dashboard Layout

```tsx
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r",
          "transform transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
```

### Stats Grid

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard title="Battery" value={85} unit="%" />
  <MetricCard title="Range" value={267} unit="mi" />
  <MetricCard title="Efficiency" value={248} unit="Wh/mi" />
  <MetricCard title="States Visited" value={32} unit="/48" />
</div>
```

## Hooks

### useApi Hook

```tsx
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error, refetch: () => fetcher().then(setData) };
}
```

### useInterval Hook

```tsx
export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

## Dark Mode

```tsx
// ThemeProvider using CSS variables
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```
