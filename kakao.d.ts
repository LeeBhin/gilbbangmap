interface Window {
  kakao: any;
}

declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    getCenter(): LatLng;
    setCenter(latlng: LatLng): void;
    relayout(): void;  // relayout 메서드를 명시적으로 선언
  }

  interface MapOptions {
    center: LatLng;
    level: number;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
  }

  interface MarkerOptions {
    position: LatLng;
  }

  function load(callback: () => void): void;
  namespace event {
    function trigger(target: any, type: string): void;
  }
}
