'use client';

import style from '@/app/styles/home.module.css';
import { useEffect, useRef, useState } from 'react';
import { Circle, Marker, Playgon } from '@/public/svgs';
import { supabase } from '@/lib/supabase';
const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

declare global {
  interface Window {
    kakao: any;
  }
}

const Map: React.FC = () => {
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const drawingManagerRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isInputVisible, setIsInputVisible] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [canDraw, setCanDraw] = useState<boolean>(true);
  const [shapeCenter, setShapeCenter] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [savedManager, setSavedManager] = useState<any>(null);
  const [votedItems, setVotedItems] = useState<{ [key: string]: boolean }>({});

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

        console.log('Map loaded:', map);

        // 줌 컨트롤 추가
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // 지도 타입 컨트롤 추가
        const mapTypeControl = new window.kakao.maps.MapTypeControl();
        map.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

        const drawingOptions = {
          map: map,
          drawingMode: [
            window.kakao.maps.drawing.OverlayType.MARKER,
            window.kakao.maps.drawing.OverlayType.CIRCLE,
            window.kakao.maps.drawing.OverlayType.POLYGON
          ],
          guideTooltip: ['draw', 'drag', 'edit'],
          markerOptions: {
            draggable: false,
            removable: false
          },
          circleOptions: {
            draggable: true,
            removable: false,
            editable: true,
            strokeColor: '#00a0e9',
            fillColor: '#00a0e9',
            fillOpacity: 0.6
          },
          polygonOptions: {
            draggable: true,
            removable: false,
            editable: true,
            strokeColor: '#00a0e9',
            fillColor: '#00a0e9',
            fillOpacity: 0.6,
            hintStrokeStyle: 'dash',
            hintStrokeOpacity: 0.5
          }
        };

        const drawingManager = new window.kakao.maps.drawing.DrawingManager(drawingOptions);
        drawingManagerRef.current = drawingManager;
        setSavedManager(drawingManager);

        console.log('Drawing manager initialized:', drawingManager);

        const handleDrawEnd = (data: any) => {
          console.log('Draw ended:', data);
          setCurrentShape(data.target);
          setIsDrawing(true);
          setCanDraw(false);

          let center;
          if (data.target.getPosition) {
            center = data.target.getPosition(); // 원의 경우 또는 마커의 경우
          } else if (data.target.getPath) {
            const path = data.target.getPath(); // 다각형의 경우
            let sumLat = 0;
            let sumLng = 0;
            const count = path.length;

            path.forEach((point: any) => {
              const latLng = point; // 포인트를 위도, 경도로 변환
              sumLat += latLng.getLat();
              sumLng += latLng.getLng();
            });
            center = new window.kakao.maps.LatLng(sumLat / count, sumLng / count);
          }

          // 마커의 경우 상단으로 조금 올림
          if (data.target.getPosition) {
            setShapeCenter({ x: center.getLng() + 80, y: center.getLat() - 80 });
          } else {
            setShapeCenter({ x: center.getLng(), y: center.getLat() });
          }
        };

        window.kakao.maps.event.addListener(drawingManager, 'drawend', handleDrawEnd);
      });
    };

    script.onerror = () => {
      console.error('Failed to load Kakao map script');
    };
  }, []);

  const handleStartDrawing = (type: any) => {
    if (drawingManagerRef.current && canDraw) {
      drawingManagerRef.current.select(type);
    }
  };

  const handleConfirm = () => {
    setIsInputVisible(true);
    setIsDrawing(false);
  };

  const handleCancel = () => {
    if (currentShape) {
      if (drawingManagerRef.current) {
        drawingManagerRef.current.cancel();
      }

      currentShape.setMap(null);

      drawingManagerRef.current.remove(currentShape);

      setCurrentShape(null);
      setCanDraw(true);
    }
    setIsDrawing(false);
    setIsInputVisible(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };

  const handleSave = async () => {
    if (nickname && savedManager) {
      const data = savedManager.getData();

      for (const [type, shapes] of Object.entries(data)) {
        if (shapes && shapes.length > 0) {
          for (const shape of shapes) {
            const shapeData = {
              name: nickname,
              zone_type: type.toLowerCase(),
              coordinates: JSON.stringify(shape),
              status: 'pending',
              agree_count: 0,
              disagree_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };

            try {
              const { data, error } = await supabase.from('smoke_zones').insert([shapeData]);
              if (error) {
                console.error('Error saving data:', error);
              } else {
                alert('요청이 완료되었습니다.');
                console.log('Saved data:', data);
              }
            } catch (error) {
              console.error('Error saving data:', error);
            }
          }
        }
      }

      if (drawingManagerRef.current) {
        drawingManagerRef.current.cancel();
      }

      if (currentShape) {
        currentShape.setMap(null);
        drawingManagerRef.current.remove(currentShape);
      }

      setIsDrawing(false);
      setIsInputVisible(false);
      setNickname('');
      setCurrentShape(null);
      setCanDraw(true);
    }
  };

  const handleVote = async (id: string, isAgree: boolean) => {
    if (votedItems[id]) {
      alert('이미 참여하셨습니다.');
      return;
    }
  
    const field = isAgree ? 'agree_count' : 'disagree_count';
  
    try {
      const { data, error } = await supabase
        .from('smoke_zones')
        .select(field)
        .eq('id', id)
        .single();
  
      if (error) {
        console.error('Error fetching vote count:', error);
        return;
      }
  
      const currentCount = data[field];
      const newCount = currentCount + 1;
  
      const { updateError } = await supabase
        .from('smoke_zones')
        .update({ [field]: newCount })
        .eq('id', id);
  
      if (updateError) {
        console.error('Error updating vote:', updateError);
      } else {
        setVotedItems({ ...votedItems, [id]: true });
        alert('참여가 완료되었습니다.');
  
        if (isAgree && newCount >= 10) {
          const { statusUpdateError } = await supabase
            .from('smoke_zones')
            .update({ status: 'approved' })
            .eq('id', id);
  
          if (statusUpdateError) {
            console.error('Error updating status to approved:', statusUpdateError);
          } else {
            alert('Zone approved!');
          }
        }
      }
    } catch (error) {
      console.error('Error updating vote:', error);
    }
  };

  const loadPendingShapes = async () => {
    // load pending shapes logic
  };

  useEffect(() => {
    loadPendingShapes();
  }, [loadPendingShapes]);

  return (
    <div>
      <div id="map" className={style.map}></div>
      <button onClick={() => handleStartDrawing(window.kakao.maps.drawing.OverlayType.MARKER)}>마커</button>
      <button onClick={() => handleStartDrawing(window.kakao.maps.drawing.OverlayType.CIRCLE)}>원</button>
      <button onClick={() => handleStartDrawing(window.kakao.maps.drawing.OverlayType.POLYGON)}>다각형</button>
      {isDrawing && (
        <div>
          <button onClick={handleConfirm}>확인</button>
          <button onClick={handleCancel}>취소</button>
        </div>
      )}
      {isInputVisible && (
        <div>
          <input type="text" value={nickname} onChange={handleInputChange} placeholder="닉네임" />
          <button onClick={handleSave}>저장</button>
        </div>
      )}
    </div>
  );
};

export default Map;
