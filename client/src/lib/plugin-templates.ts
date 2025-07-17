import { PluginTypeTemplate, PluginConfiguration } from '@/types/plugin-interfaces';

// Pre-defined Plugin Templates based on the Interface Mapping Document
export const pluginTemplates: Record<string, PluginTypeTemplate> = {
  car_pose: {
    name: "Car Pose Plugin",
    description: "Provides vehicle position and orientation data",
    category: "data_source",
    requiredFields: ["dataColumns", "signals", "dataSource"],
    template: {
      dataColumns: [
        {
          name: "timestamp",
          dataType: "timestamp",
          units: "seconds",
          description: "Unix timestamp",
          required: true
        },
        {
          name: "cp_x",
          dataType: "float64",
          units: "meters",
          description: "Vehicle X coordinate",
          required: true
        },
        {
          name: "cp_y",
          dataType: "float64",
          units: "meters",
          description: "Vehicle Y coordinate",
          required: true
        },
        {
          name: "cp_yaw_deg",
          dataType: "float64",
          units: "degrees",
          description: "Vehicle heading angle",
          required: true
        }
      ],
      signals: [
        {
          name: "car_pose(t)",
          type: "spatial",
          mode: "dynamic",
          description: "Vehicle position and orientation at timestamp",
          handlerFunction: "handle_car_pose_at_timestamp",
          outputFormat: {
            type: "object",
            structure: {
              x: "float",
              y: "float",
              theta: "float"
            },
            examples: [
              { x: 10.5, y: 20.3, theta: 45.0 }
            ]
          }
        },
        {
          name: "route",
          type: "spatial",
          mode: "static",
          description: "Complete route trajectory",
          handlerFunction: "route_handler",
          outputFormat: {
            type: "object",
            structure: {
              x: "List[float]",
              y: "List[float]"
            },
            examples: [
              { x: [0, 10, 20], y: [0, 15, 30] }
            ]
          }
        },
        {
          name: "timestamps",
          type: "temporal",
          mode: "static",
          description: "All available timestamps",
          handlerFunction: "get_timestamps",
          outputFormat: {
            type: "array",
            structure: { type: "List[float]" },
            examples: [
              [1609459200.0, 1609459201.0, 1609459202.0]
            ]
          }
        }
      ],
      dataSource: {
        type: "csv",
        filePattern: "car_pose.csv",
        format: {
          delimiter: ",",
          encoding: "utf-8",
          headers: true,
          skipRows: 0
        },
        validation: {
          requiredColumns: ["timestamp", "cp_x", "cp_y", "cp_yaw_deg"],
          dataTypes: {
            timestamp: "float64",
            cp_x: "float64",
            cp_y: "float64",
            cp_yaw_deg: "float64"
          },
          constraints: [
            {
              column: "timestamp",
              type: "not_null",
              value: null,
              message: "Timestamp cannot be null"
            },
            {
              column: "cp_yaw_deg",
              type: "range",
              value: [-180, 180],
              message: "Yaw angle must be between -180 and 180 degrees"
            }
          ]
        }
      },
      visualization: {
        enabled: true,
        charts: [
          {
            type: "spatial_2d",
            title: "Vehicle Trajectory",
            axes: {
              x: {
                signal: "route.x",
                label: "X Position",
                units: "meters"
              },
              y: {
                signal: "route.y",
                label: "Y Position",
                units: "meters"
              }
            },
            series: [
              {
                signal: "route",
                label: "Planned Route",
                color: "#3b82f6",
                style: "solid"
              },
              {
                signal: "car_pose(t)",
                label: "Current Position",
                color: "#ef4444",
                marker: "circle"
              }
            ],
            options: {
              legend: true,
              grid: true,
              zoom: true,
              pan: true,
              export: true,
              realtime: true
            }
          }
        ],
        displays: [
          {
            type: "text",
            title: "Current Position",
            signal: "car_pose(t)",
            format: {
              precision: 2,
              unit: "m"
            },
            position: {
              panel: "right",
              order: 1,
              size: "medium"
            }
          }
        ],
        interactions: [
          {
            type: "hover",
            target: "trajectory_chart",
            action: {
              type: "show_details",
              parameters: {
                signals: ["car_pose(t)"]
              }
            }
          }
        ]
      },
      processing: {
        enabled: true,
        pipeline: [
          {
            name: "data_validation",
            type: "validate",
            parameters: {
              check_timestamps: true,
              check_coordinates: true
            },
            enabled: true,
            order: 1
          },
          {
            name: "interpolation",
            type: "interpolate",
            parameters: {
              method: "linear",
              max_gap: 1.0
            },
            enabled: true,
            order: 2
          }
        ],
        caching: {
          enabled: true,
          strategy: "memory",
          ttl: 300,
          maxSize: 100,
          keyPattern: "car_pose_{timestamp}"
        },
        performance: {
          batchSize: 1000,
          maxConcurrency: 4,
          timeout: 30,
          retryAttempts: 3,
          optimization: {
            vectorization: true,
            parallelization: true,
            lazyLoading: true
          }
        }
      }
    },
    examples: [
      {
        name: "Basic Car Pose",
        description: "Simple vehicle position tracking",
        configuration: {} as PluginConfiguration,
        sampleData: {
          timestamp: 1609459200.0,
          cp_x: 10.5,
          cp_y: 20.3,
          cp_yaw_deg: 45.0
        }
      }
    ]
  },

  path_view: {
    name: "Path View Plugin",
    description: "Provides path trajectory data and collision detection",
    category: "analysis",
    requiredFields: ["dataColumns", "signals", "dataSource", "visualization"],
    template: {
      dataColumns: [
        {
          name: "timestamp",
          dataType: "timestamp",
          units: "seconds",
          description: "Unix timestamp",
          required: true
        },
        {
          name: "path_x",
          dataType: "float64",
          units: "meters",
          description: "Path point X coordinate",
          required: true
        },
        {
          name: "path_y",
          dataType: "float64",
          units: "meters",
          description: "Path point Y coordinate",
          required: true
        },
        {
          name: "path_heading",
          dataType: "float64",
          units: "degrees",
          description: "Path heading angle",
          required: true
        },
        {
          name: "vehicle_x",
          dataType: "float64",
          units: "meters",
          description: "Vehicle X position",
          required: true
        },
        {
          name: "vehicle_y",
          dataType: "float64",
          units: "meters",
          description: "Vehicle Y position",
          required: true
        },
        {
          name: "vehicle_heading",
          dataType: "float64",
          units: "degrees",
          description: "Vehicle heading",
          required: true
        }
      ],
      signals: [
        {
          name: "path_in_world_coordinates(t)",
          type: "spatial",
          mode: "dynamic",
          description: "Path coordinates in world frame",
          handlerFunction: "get_path_world_at_timestamp",
          outputFormat: {
            type: "object",
            structure: {
              x: "List[float]",
              y: "List[float]",
              heading: "List[float]"
            },
            examples: [
              { x: [0, 10, 20], y: [0, 15, 30], heading: [0, 45, 90] }
            ]
          }
        },
        {
          name: "collision_margin_distance(t)",
          type: "temporal",
          mode: "dynamic",
          description: "Distance to collision margin",
          handlerFunction: "get_collision_margin_distance_at_timestamp",
          outputFormat: {
            type: "object",
            structure: {
              value: "float",
              threshold: "float",
              is_violation: "bool",
              margin_type: "str"
            },
            examples: [
              { value: 1.5, threshold: 2.0, is_violation: true, margin_type: "lateral" }
            ]
          }
        }
      ],
      dataSource: {
        type: "csv",
        filePattern: "path_trajectory.csv",
        format: {
          delimiter: ",",
          encoding: "utf-8",
          headers: true,
          skipRows: 0
        },
        validation: {
          requiredColumns: ["timestamp", "path_x", "path_y", "path_heading", "vehicle_x", "vehicle_y", "vehicle_heading"],
          dataTypes: {
            timestamp: "float64",
            path_x: "float64",
            path_y: "float64",
            path_heading: "float64",
            vehicle_x: "float64",
            vehicle_y: "float64",
            vehicle_heading: "float64"
          },
          constraints: [
            {
              column: "collision_margin_threshold",
              type: "range",
              value: [0.1, 10.0],
              message: "Collision margin threshold must be between 0.1 and 10.0 meters"
            }
          ]
        }
      },
      visualization: {
        enabled: true,
        charts: [
          {
            type: "spatial_2d",
            title: "Path Trajectory with Collision Detection",
            axes: {
              x: {
                signal: "path_in_world_coordinates(t).x",
                label: "X Position",
                units: "meters"
              },
              y: {
                signal: "path_in_world_coordinates(t).y",
                label: "Y Position",
                units: "meters"
              }
            },
            series: [
              {
                signal: "path_in_world_coordinates(t)",
                label: "Planned Path",
                color: "#3b82f6",
                style: "solid"
              }
            ],
            options: {
              legend: true,
              grid: true,
              zoom: true,
              pan: true,
              export: true,
              realtime: true
            }
          },
          {
            type: "line",
            title: "Collision Margin Distance",
            axes: {
              x: {
                signal: "timestamps",
                label: "Time",
                units: "seconds",
                scale: "time"
              },
              y: {
                signal: "collision_margin_distance(t).value",
                label: "Distance",
                units: "meters"
              }
            },
            series: [
              {
                signal: "collision_margin_distance(t)",
                label: "Margin Distance",
                color: "#ef4444"
              }
            ],
            options: {
              legend: true,
              grid: true,
              zoom: true,
              pan: true,
              export: true,
              realtime: true
            }
          }
        ],
        displays: [
          {
            type: "gauge",
            title: "Collision Risk",
            signal: "collision_margin_distance(t)",
            format: {
              precision: 2,
              unit: "m",
              colorScale: {
                type: "threshold",
                values: [
                  { value: 0, color: "#ef4444", label: "Critical" },
                  { value: 1, color: "#f97316", label: "Warning" },
                  { value: 2, color: "#22c55e", label: "Safe" }
                ]
              }
            },
            position: {
              panel: "right",
              order: 1,
              size: "large"
            },
            conditions: [
              {
                signal: "collision_margin_distance(t).is_violation",
                operator: "eq",
                value: true,
                style: {
                  color: "#ef4444",
                  backgroundColor: "#fee2e2",
                  fontWeight: "bold",
                  icon: "alert-triangle"
                }
              }
            ]
          }
        ],
        interactions: [
          {
            type: "click",
            target: "path_chart",
            action: {
              type: "bookmark",
              parameters: {
                label: "Path Point",
                color: "#3b82f6"
              }
            }
          }
        ]
      },
      processing: {
        enabled: true,
        pipeline: [
          {
            name: "collision_detection",
            type: "transform",
            parameters: {
              threshold: 2.0,
              vehicle_config: "niro_ev2",
              safety_margin: 0.5
            },
            enabled: true,
            order: 1
          },
          {
            name: "path_smoothing",
            type: "smooth",
            parameters: {
              method: "gaussian",
              window_size: 5,
              sigma: 1.0
            },
            enabled: true,
            order: 2
          }
        ],
        caching: {
          enabled: true,
          strategy: "hybrid",
          ttl: 600,
          maxSize: 500,
          keyPattern: "path_view_{timestamp}_{threshold}"
        },
        performance: {
          batchSize: 500,
          maxConcurrency: 8,
          timeout: 60,
          retryAttempts: 3,
          optimization: {
            vectorization: true,
            parallelization: true,
            lazyLoading: true
          }
        }
      }
    },
    examples: [
      {
        name: "Path with Collision Detection",
        description: "Path trajectory with real-time collision monitoring",
        configuration: {} as PluginConfiguration,
        sampleData: {
          timestamp: 1609459200.0,
          path_x: 15.0,
          path_y: 25.0,
          path_heading: 30.0,
          vehicle_x: 14.8,
          vehicle_y: 24.9,
          vehicle_heading: 31.0
        }
      }
    ]
  },

  car_state: {
    name: "Car State Plugin",
    description: "Provides vehicle state information (speed, steering, driving mode)",
    category: "data_source",
    requiredFields: ["dataColumns", "signals", "dataSource"],
    template: {
      dataColumns: [
        {
          name: "timestamp",
          dataType: "timestamp",
          units: "seconds",
          description: "Unix timestamp",
          required: true
        },
        {
          name: "current_speed",
          dataType: "float64",
          units: "m/s",
          description: "Current vehicle speed",
          required: true
        },
        {
          name: "steering_angle",
          dataType: "float64",
          units: "degrees",
          description: "Current steering angle",
          required: true
        },
        {
          name: "driving_mode",
          dataType: "string",
          description: "Current driving mode",
          required: true
        },
        {
          name: "target_speed",
          dataType: "float64",
          units: "m/s",
          description: "Target speed command",
          required: false
        }
      ],
      signals: [
        {
          name: "current_speed",
          type: "temporal",
          mode: "dynamic",
          description: "Current vehicle speed at timestamp",
          handlerFunction: "get_current_speed_at_timestamp",
          outputFormat: {
            type: "single_value",
            structure: { type: "float" },
            examples: [{ value: 15.6 }]
          }
        },
        {
          name: "current_steering",
          type: "temporal",
          mode: "dynamic",
          description: "Current steering angle at timestamp",
          handlerFunction: "get_current_steering_angle",
          outputFormat: {
            type: "single_value",
            structure: { type: "float" },
            examples: [{ value: 12.5 }]
          }
        },
        {
          name: "driving_mode",
          type: "categorical",
          mode: "dynamic",
          description: "Current driving mode at timestamp",
          handlerFunction: "get_driving_mode_at_timestamp",
          categories: ["MANUAL", "AUTONOMOUS", "PARK_ASSIST", "EMERGENCY"],
          outputFormat: {
            type: "single_value",
            structure: { type: "string" },
            examples: [{ value: "AUTONOMOUS" }]
          }
        }
      ],
      dataSource: {
        type: "csv",
        filePattern: "*.csv",
        format: {
          delimiter: ",",
          encoding: "utf-8",
          headers: true,
          skipRows: 0
        },
        validation: {
          requiredColumns: ["timestamp", "data_value"],
          dataTypes: {
            timestamp: "float64",
            data_value: "float64"
          },
          constraints: [
            {
              column: "data_value",
              type: "not_null",
              value: null,
              message: "Data value cannot be null"
            }
          ]
        }
      },
      visualization: {
        enabled: true,
        charts: [
          {
            type: "line",
            title: "Vehicle Speed Over Time",
            axes: {
              x: {
                signal: "timestamps",
                label: "Time",
                units: "seconds",
                scale: "time"
              },
              y: {
                signal: "current_speed",
                label: "Speed",
                units: "m/s"
              }
            },
            series: [
              {
                signal: "current_speed",
                label: "Current Speed",
                color: "#3b82f6"
              },
              {
                signal: "target_speed",
                label: "Target Speed",
                color: "#10b981",
                style: "dashed"
              }
            ],
            options: {
              legend: true,
              grid: true,
              zoom: true,
              pan: true,
              export: true,
              realtime: true
            }
          }
        ],
        displays: [
          {
            type: "gauge",
            title: "Current Speed",
            signal: "current_speed",
            format: {
              precision: 1,
              unit: "m/s"
            },
            position: {
              panel: "right",
              order: 1,
              size: "large"
            }
          },
          {
            type: "indicator",
            title: "Driving Mode",
            signal: "driving_mode",
            format: {
              colorScale: {
                type: "categorical",
                values: [
                  { value: "MANUAL", color: "#6b7280", label: "Manual" },
                  { value: "AUTONOMOUS", color: "#3b82f6", label: "Autonomous" },
                  { value: "PARK_ASSIST", color: "#10b981", label: "Park Assist" },
                  { value: "EMERGENCY", color: "#ef4444", label: "Emergency" }
                ]
              }
            },
            position: {
              panel: "right",
              order: 2,
              size: "medium"
            }
          }
        ],
        interactions: []
      },
      processing: {
        enabled: true,
        pipeline: [
          {
            name: "speed_filtering",
            type: "filter",
            parameters: {
              min_speed: 0,
              max_speed: 100
            },
            enabled: true,
            order: 1
          },
          {
            name: "data_smoothing",
            type: "smooth",
            parameters: {
              method: "moving_average",
              window_size: 5
            },
            enabled: true,
            order: 2
          }
        ],
        caching: {
          enabled: true,
          strategy: "memory",
          ttl: 300,
          maxSize: 200,
          keyPattern: "car_state_{timestamp}"
        },
        performance: {
          batchSize: 1000,
          maxConcurrency: 4,
          timeout: 30,
          retryAttempts: 3,
          optimization: {
            vectorization: true,
            parallelization: false,
            lazyLoading: true
          }
        }
      }
    },
    examples: [
      {
        name: "Basic Car State",
        description: "Simple vehicle state monitoring",
        configuration: {} as PluginConfiguration,
        sampleData: {
          timestamp: 1609459200.0,
          current_speed: 15.6,
          steering_angle: 12.5,
          driving_mode: "AUTONOMOUS"
        }
      }
    ]
  },

  streaming_data: {
    name: "Streaming Data Plugin",
    description: "Real-time data streaming and monitoring",
    category: "streaming",
    requiredFields: ["dataColumns", "signals", "dataSource"],
    template: {
      dataColumns: [
        {
          name: "timestamp",
          dataType: "timestamp",
          units: "seconds",
          description: "Data timestamp",
          required: true
        },
        {
          name: "value",
          dataType: "float64",
          units: "varies",
          description: "Monitored value",
          required: true
        }
      ],
      signals: [
        {
          name: "csv_live_data",
          type: "temporal",
          mode: "live",
          description: "Real-time CSV data stream",
          handlerFunction: "get_live_data",
          outputFormat: {
            type: "object",
            structure: {
              timestamps: "List[float]",
              values: "List[float]",
              last_update: "float"
            },
            examples: [
              { 
                timestamps: [1609459200.0, 1609459201.0], 
                values: [10.5, 11.2], 
                last_update: 1609459201.0 
              }
            ]
          }
        },
        {
          name: "csv_data_rate",
          type: "temporal",
          mode: "live",
          description: "Data update rate (Hz)",
          handlerFunction: "get_data_rate",
          outputFormat: {
            type: "object",
            structure: {
              value: "float",
              unit: "str",
              data_points: "int"
            },
            examples: [
              { value: 10.0, unit: "Hz", data_points: 100 }
            ]
          }
        }
      ],
      dataSource: {
        type: "streaming",
        filePattern: "*.csv",
        format: {
          delimiter: ",",
          encoding: "utf-8",
          headers: true,
          skipRows: 0
        },
        validation: {
          requiredColumns: ["timestamp", "value"],
          dataTypes: {
            timestamp: "float64",
            value: "float64"
          },
          constraints: [
            {
              column: "value",
              type: "not_null",
              value: null,
              message: "Value cannot be null"
            }
          ]
        }
      },
      visualization: {
        enabled: true,
        charts: [
          {
            type: "line",
            title: "Live Data Stream",
            axes: {
              x: {
                signal: "csv_live_data.timestamps",
                label: "Time",
                units: "seconds",
                scale: "time"
              },
              y: {
                signal: "csv_live_data.values",
                label: "Value",
                units: "varies"
              }
            },
            series: [
              {
                signal: "csv_live_data",
                label: "Live Data",
                color: "#ef4444"
              }
            ],
            options: {
              legend: true,
              grid: true,
              zoom: true,
              pan: true,
              export: true,
              realtime: true
            }
          }
        ],
        displays: [
          {
            type: "indicator",
            title: "Data Rate",
            signal: "csv_data_rate",
            format: {
              precision: 1,
              unit: "Hz"
            },
            position: {
              panel: "right",
              order: 1,
              size: "medium"
            }
          }
        ],
        interactions: []
      },
      processing: {
        enabled: true,
        pipeline: [
          {
            name: "buffer_management",
            type: "aggregate",
            parameters: {
              max_buffer_size: 1000,
              aggregation_window: 10
            },
            enabled: true,
            order: 1
          }
        ],
        caching: {
          enabled: true,
          strategy: "memory",
          ttl: 60,
          maxSize: 50,
          keyPattern: "streaming_{timestamp}"
        },
        performance: {
          batchSize: 100,
          maxConcurrency: 2,
          timeout: 10,
          retryAttempts: 2,
          optimization: {
            vectorization: false,
            parallelization: false,
            lazyLoading: false
          }
        }
      }
    },
    examples: [
      {
        name: "Real-time CSV Monitor",
        description: "Monitor CSV file changes in real-time",
        configuration: {} as PluginConfiguration,
        sampleData: {
          timestamp: 1609459200.0,
          value: 42.5
        }
      }
    ]
  }
};

export const getPluginTemplate = (pluginType: string): PluginTypeTemplate | null => {
  return pluginTemplates[pluginType] || null;
};

export const getAvailablePluginTypes = (): string[] => {
  return Object.keys(pluginTemplates);
};

export const getPluginTypesByCategory = (category: string): PluginTypeTemplate[] => {
  return Object.values(pluginTemplates).filter(template => template.category === category);
};