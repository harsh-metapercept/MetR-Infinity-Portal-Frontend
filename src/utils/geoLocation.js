export const getUserLocation = (showModal = false) => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      getIPLocation().then(resolve);
      return;
    }

    // If modal is requested, resolve immediately and let component handle it
    if (showModal) {
      resolve({ needsPermission: true });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((data) => {
            resolve({
              latitude,
              longitude,
              country: data?.countryName || undefined,
            });
          })
          .catch(() => {
            resolve({ latitude, longitude });
          });
      },
      () => {
        getIPLocation().then(resolve);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
};

export const requestLocationPermission = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      getIPLocation().then(resolve);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
          .then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          })
          .then((data) => {
            resolve({
              latitude,
              longitude,
              country: data?.countryName || undefined,
            });
          })
          .catch(() => {
            resolve({ latitude, longitude });
          });
      },
      () => {
        getIPLocation().then(resolve);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
};

const getIPLocation = () => {
  return fetch("https://ipapi.co/json/")
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      if (data?.latitude && data?.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          country: data.country_name,
        };
      }
      throw new Error("Invalid IP location data");
    })
    .catch(() => {
      return fetch("https://freeipapi.com/api/json")
        .then((res) => res.json())
        .then((data) => {
          if (data?.latitude && data?.longitude) {
            return {
              latitude: data.latitude,
              longitude: data.longitude,
              country: data.countryName,
            };
          }
          throw new Error("Alternative IP service failed");
        })
        .catch(() => {
          return {};
        });
    });
};
