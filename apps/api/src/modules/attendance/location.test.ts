import { describe, it, expect } from "vitest";
import {
  haversineMeters,
  isWithinRadius,
  ipv4ToLong,
  ipInCidr,
  isIpInAnyCidr,
} from "./location";

// Sekolah contoh (Surabaya).
const school = { lat: -7.2575, lng: 112.7521 };

describe("geofence (Haversine)", () => {
  it("jarak titik sama = 0 m", () => {
    expect(haversineMeters(school, school)).toBeCloseTo(0, 5);
  });

  it("~111 m per 0.001° lintang", () => {
    const d = haversineMeters(school, { lat: school.lat + 0.001, lng: school.lng });
    expect(d).toBeGreaterThan(105);
    expect(d).toBeLessThan(118);
  });

  it("isWithinRadius: di dalam vs di luar radius 150 m", () => {
    const near = { lat: school.lat + 0.0005, lng: school.lng }; // ~55 m
    const far = { lat: school.lat + 0.01, lng: school.lng }; // ~1.1 km
    expect(isWithinRadius(school, near, 150)).toBe(true);
    expect(isWithinRadius(school, far, 150)).toBe(false);
  });
});

describe("IP / CIDR (IPv4)", () => {
  it("ipv4ToLong: valid & tolak invalid", () => {
    expect(ipv4ToLong("0.0.0.0")).toBe(0);
    expect(ipv4ToLong("255.255.255.255")).toBe(0xffffffff);
    expect(ipv4ToLong("10.20.30.40")).toBe(((10 << 24) | (20 << 16) | (30 << 8) | 40) >>> 0);
    expect(ipv4ToLong("256.1.1.1")).toBeNull();
    expect(ipv4ToLong("10.20.30")).toBeNull();
    expect(ipv4ToLong("abc")).toBeNull();
  });

  it("ipInCidr: di dalam & di luar blok", () => {
    expect(ipInCidr("10.20.5.7", "10.20.0.0/16")).toBe(true);
    expect(ipInCidr("10.21.0.1", "10.20.0.0/16")).toBe(false);
    expect(ipInCidr("192.168.1.50", "192.168.1.0/24")).toBe(true);
    expect(ipInCidr("192.168.2.50", "192.168.1.0/24")).toBe(false);
    expect(ipInCidr("1.2.3.4", "0.0.0.0/0")).toBe(true); // /0 cocok semua
    expect(ipInCidr("10.0.0.1", "10.0.0.1/32")).toBe(true); // host tunggal
    expect(ipInCidr("10.0.0.2", "10.0.0.1/32")).toBe(false);
  });

  it("ipInCidr: tolak CIDR/IP rusak", () => {
    expect(ipInCidr("10.0.0.1", "10.0.0.0/33")).toBe(false);
    expect(ipInCidr("10.0.0.1", "10.0.0.0")).toBe(false);
    expect(ipInCidr("bad", "10.0.0.0/8")).toBe(false);
  });

  it("isIpInAnyCidr: cocok salah satu", () => {
    const cidrs = ["192.168.0.0/16", "10.20.0.0/16"];
    expect(isIpInAnyCidr("10.20.99.1", cidrs)).toBe(true);
    expect(isIpInAnyCidr("172.16.0.1", cidrs)).toBe(false);
  });
});
