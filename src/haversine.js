const EARTH_RADIUS_METERS = 6_371_000;

function haversineDistanceMeters(pointA, pointB) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeA = toRadians(pointA.latitude);
  const latitudeB = toRadians(pointB.latitude);
  const deltaLatitude = toRadians(pointB.latitude - pointA.latitude);
  const deltaLongitude = toRadians(pointB.longitude - pointA.longitude);

  const a = Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(deltaLongitude / 2) ** 2;
  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * centralAngle;
}

module.exports = { haversineDistanceMeters };
