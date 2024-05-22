'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase'; // supabase 연결된 파일 경로에 맞게 수정해주세요.
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

declare global {
  interface Window {
    kakao: any;
  }
}

const SimpleMap: React.FC = () => {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const [shapes, setShapes] = useState<any[]>([]); // supabase에서 불러온 데이터를 저장할 상태

  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=drawing&autoload=false`;
    document.head.appendChild(script);

    script.onload = () => {
      if (!window.kakao) {
        console.error('Kakao map script not loaded');
        return;
      }

      window.kakao.maps.load(() => {
        const container = document.getElementById('map') as HTMLElement;
        const options = {
          center: new window.kakao.maps.LatLng(37.551815, 126.991791),
          level: 7,
        };
        const map = new window.kakao.maps.Map(container, options);
        mapRef.current = map;

        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        // supabase에서 shapes를 불러와서 지도에 표시
        loadShapes();
      });
    };
  }, []);

  // supabase에서 shapes를 불러와서 지도에 표시하는 함수
  const loadShapes = async () => {
    try {
      // supabase에서 shapes 데이터를 불러옴 (status가 'approved'인 것만)
      const { data: shapesData, error } = await supabase
        .from('smoke_zones')
        .select('*')
        .eq('status', 'approved');
      if (error) {
        console.error('Error fetching shapes:', error.message);
        return;
      }

      // shapes를 지도에 표시
      if (shapesData && shapesData.length > 0) {
        const map = mapRef.current;
        if (map) {
          const newShapes = shapesData.map((shape: any) => {
            const coordinates = JSON.parse(shape.coordinates);
            let newShape;
            
            if (shape.zone_type === 'marker') {
              // 마커 생성
              newShape = new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(coordinates.y, coordinates.x),
                map: map,
                title: shape.name,
              });

              // 마커에 정보창 추가
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;">${shape.name}</div>`
              });
              window.kakao.maps.event.addListener(newShape, 'mouseover', () => {
                infowindow.open(map, newShape);
              });
              window.kakao.maps.event.addListener(newShape, 'mouseout', () => {
                infowindow.close();
              });

            } else if (shape.zone_type === 'circle') {
              // 원 생성
              newShape = new window.kakao.maps.Circle({
                center: new window.kakao.maps.LatLng(coordinates.center.y, coordinates.center.x),
                radius: coordinates.radius, // 원의 반지름
                strokeColor: coordinates.options.strokeColor,
                strokeOpacity: coordinates.options.strokeOpacity,
                strokeWeight: coordinates.options.strokeWeight,
                fillColor: coordinates.options.fillColor,
                fillOpacity: coordinates.options.fillOpacity,
                map: map,
              });

              // 원에 정보창 추가
              const center = new window.kakao.maps.LatLng(coordinates.center.y, coordinates.center.x);
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;">${shape.name}</div>`,
                position: center
              });
              infowindow.open(map);

            } else if (shape.zone_type === 'polygon') {
              // 다각형 생성
              const path = coordinates.points.map((point: any) => new window.kakao.maps.LatLng(point.y, point.x));
              newShape = new window.kakao.maps.Polygon({
                path: path,
                strokeColor: coordinates.options.strokeColor,
                strokeOpacity: coordinates.options.strokeOpacity,
                strokeWeight: coordinates.options.strokeWeight,
                fillColor: coordinates.options.fillColor,
                fillOpacity: coordinates.options.fillOpacity,
                map: map,
              });

              // 다각형에 정보창 추가
              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:5px;">${shape.name}</div>`,
                position: path[0]
              });
              infowindow.open(map);
            }
            return newShape;
          });
          setShapes(newShapes);
        }
      }
    } catch (error) {
      console.error('Error loading shapes:', error.message);
    }
  };

  return (
    <div id="map" style={{ width: '100%', height: '100%' }}></div>
  );
};

export default SimpleMap;
