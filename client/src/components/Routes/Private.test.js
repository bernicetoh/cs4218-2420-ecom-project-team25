import React from 'react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Spinner from '../Spinner';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import PrivateRoute from './Private';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

jest.mock('axios');
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()]),
}));

// need to mock react for useEffect
// https://medium.com/@ashwinKumar0505/how-to-write-unit-test-cases-for-use-effect-react-hooks-using-jest-and-enzyme-5a2a32844a4d
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn((fn) => fn()),
  useState: jest.fn(() => [false, jest.fn()]),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

let consoleSpy;

describe('Private', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // reuses Header.test.js
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('should return Spinner by default if no auth token is present', async () => {
    useAuth.mockReturnValueOnce([{}, jest.fn()]);
    expect(PrivateRoute()).toStrictEqual(<Spinner />);

    render(<PrivateRoute />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
    expect(consoleSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  it('should return Spinner if auth token is present and authCheck returns false', async () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    expect(PrivateRoute()).toStrictEqual(<Spinner />);

    render(<PrivateRoute />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
    });

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth');
    });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should return Outlet if auth token is present and authCheck returns true', async () => {
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    useState.mockReturnValueOnce([true, jest.fn()]);

    expect(PrivateRoute()).toStrictEqual(<Outlet />);

    render(<PrivateRoute />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
    expect(consoleSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  it('should not crash if get errors out', async () => {
    const err = new Error('Failed to query auth status');
    axios.get.mockRejectedValueOnce(err);
    useAuth.mockReturnValueOnce([{ token: 'token' }, jest.fn()]);
    render(<PrivateRoute />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(err);
    });

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth');
    });
  });
});
