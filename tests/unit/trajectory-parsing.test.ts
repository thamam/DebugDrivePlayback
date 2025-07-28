
import { PythonBackendIntegration } from '../../server/python-integration';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

describe('loadTrajectoryData header parsing', () => {
  let tempDir: string;
  const integrator = new PythonBackendIntegration();

  const createCSV = async (header: string, row: string) => {
    await fs.writeFile(path.join(tempDir, 'car_pose.csv'), `${header}\n${row}\n`);
  };

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'traj-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('parses standard headers', async () => {
    await createCSV(
      'time_stamp,car_pose_front_axle_x_meters,car_pose_front_axle_y_meters,car_pose_yaw_degrees',
      '1,10,20,30'
    );
    const result = await integrator.loadTrajectoryData(tempDir);
    expect(result.success).toBe(true);
    expect(result.trajectory?.length).toBe(1);
  });

  test('parses case-insensitive headers with _m suffix', async () => {
    await createCSV('TIME_STAMP,X_M,Y_M,YAW', '2,11,21,31');
    const result = await integrator.loadTrajectoryData(tempDir);
    expect(result.success).toBe(true);
    expect(result.trajectory?.length).toBe(1);
  });

  test('returns helpful error for missing columns', async () => {
    await createCSV('time_stamp,x_m', '3,12');
    const result = await integrator.loadTrajectoryData(tempDir);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Missing required columns/);
    expect(result.error).toMatch(/y\(_m\)/);
    expect(result.error).toMatch(/yaw/);
  });
});
