const { useState, useEffect } = React;
const { Search, Database, Settings, Users, BarChart3, AlertTriangle, ExternalLink, Wrench, Calendar, MapPin, Building, Zap, Droplets, Shield } = lucideReact;

const FMSSystem = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [dataCount, setDataCount] = useState(0);

  // CSV 데이터 로드
  useEffect(() => {
    loadCSVData();
  }, []);

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const loadCSVData = async () => {
    try {
      console.log('CSV 데이터 로딩 시작...');
      setLoadStatus('loading');
      
      const response = await fetch('./data.csv');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      console.log('CSV 텍스트 길이:', csvText.length);
      
      const lines = csvText.split('\n').filter(line => line.trim());
      console.log('총 라인 수:', lines.length);
      
      if (lines.length <= 1) {
        throw new Error('CSV 파일이 비어있거나 헤더만 있습니다');
      }
      
      // 헤더 파싱 (더 안전한 방법)
      const headers = parseCSVLine(lines[0]);
      console.log('헤더:', headers);
      
      // 데이터 파싱
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = parseCSVLine(line);
          
          // 헤더와 값의 개수가 맞는 경우만 처리
          if (values.length >= headers.length - 5) { // 약간의 여유를 줌
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            // 최소한 설비코드나 설비명이 있는 경우만 추가
            if (row['설비코드명'] || row['설비명'] || row['시설물관리코드']) {
              data.push(row);
            }
          }
        }
      }
      
      console.log('파싱된 데이터 개수:', data.length);
      console.log('첫 번째 데이터 샘플:', data[0]);
      
      // 상태 업데이트
      setCsvData(data);
      setDataCount(data.length);
      setLoadStatus('success');
      
      console.log('CSV 데이터 로드 완료:', data.length, '개 항목');
      
    } catch (error) {
      console.error('CSV 로드 오류:', error);
      setLoadStatus('error');
      setCsvData([]);
      setDataCount(0);
    }
  };

  // 검색 함수
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('검색 시작:', searchTerm, '데이터 개수:', csvData.length);
    setIsLoading(true);
    
    try {
      const term = searchTerm.toLowerCase();
      const results = csvData.filter(row => {
        const match = (
          (row['설비코드명'] && row['설비코드명'].toString().toLowerCase().includes(term)) ||
          (row['설비명'] && row['설비명'].toString().toLowerCase().includes(term)) ||
          (row['설치위치'] && row['설치위치'].toString().toLowerCase().includes(term)) ||
          (row['사업소 등록 명칭'] && row['사업소 등록 명칭'].toString().toLowerCase().includes(term)) ||
          (row['관리부서'] && row['관리부서'].toString().toLowerCase().includes(term)) ||
          (row['담당자'] && row['담당자'].toString().toLowerCase().includes(term)) ||
          (row['시설물관리코드'] && row['시설물관리코드'].toString().toLowerCase().includes(term)) ||
          (row['시설명'] && row['시설명'].toString().toLowerCase().includes(term))
        );
        return match;
      });

      console.log('검색 결과:', results.length, '개');

      // 검색 결과를 표시용 형태로 변환
      const formattedResults = results.slice(0, 50).map((row, index) => {
        const result = {
          id: index,
          code: row['설비코드명'] || row['시설물관리코드'] || row['설비코드1'] || 'N/A',
          name: row['설비명'] || row['시설명'] || 'N/A',
          facility: row['사업소 등록 명칭'] || row['시설명'] || 'N/A',
          location: row['설치위치'] || 'N/A',
          team: row['관리부서'] || 'N/A',
          specs: row['규격'] || '미등록',
          installDate: row['설치일자'] || row['설치연도'] || 'N/A',
          durability: row['내구연한'] ? `${row['내구연한']}년` : 'N/A',
          checkCycle: row['점검주기'] || 'N/A',
          manager: row['담당자'] || 'N/A',
          status: row['Status'] || 'N/A',
          notes: row['특이사항'] || '',
          quantity: row['수량'] || 'N/A'
        };
        return result;
      });

      setSearchResults(formattedResults);
      console.log('포맷된 결과:', formattedResults.length, '개');
      
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 설비 아이콘
  const getEquipmentIcon = (code) => {
    const codeUpper = code.toString().toUpperCase();
    if (codeUpper.includes('EL') || codeUpper.includes('전기')) return React.createElement(Zap, { className: "h-4 w-4 text-yellow-600" });
    if (codeUpper.includes('BO') || codeUpper.includes('보일러')) return React.createElement(Settings, { className: "h-4 w-4 text-blue-600" });
    if (codeUpper.includes('SF') || codeUpper.includes('소방')) return React.createElement(Shield, { className: "h-4 w-4 text-red-600" });
    if (codeUpper.includes('WA') || codeUpper.includes('급수')) return React.createElement(Droplets, { className: "h-4 w-4 text-blue-500" });
    return React.createElement(Settings, { className: "h-4 w-4 text-gray-600" });
  };

  // 로드 상태 표시
  const renderLoadStatus = () => {
    if (loadStatus === 'success') {
      return React.createElement('div', { className: "bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement('div', { className: "w-2 h-2 bg-green-500 rounded-full animate-pulse" }),
        React.createElement('span', { className: "text-green-700 text-sm font-medium" }, `CSV 데이터 로드 성공! (총 ${dataCount}개)`)
      );
    } else if (loadStatus === 'error') {
      return React.createElement('div', { className: "bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement(AlertTriangle, { className: "h-4 w-4 text-red-500" }),
        React.createElement('span', { className: "text-red-700 text-sm" }, '데이터 로드 실패: CSV 파일을 찾을 수 없습니다'),
        React.createElement('button', {
          onClick: loadCSVData,
          className: "ml-2 text-red-600 underline text-sm"
        }, '재시도')
      );
    } else {
      return React.createElement('div', { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2" },
        React.createElement('div', { className: "w-2 h-2 bg-yellow-500 rounded-full animate-spin" }),
        React.createElement('span', { className: "text-yellow-700 text-sm" }, 'CSV 데이터 로딩 중...')
      );
    }
  };

  return React.createElement('div', { className: "max-w-6xl mx-auto p-6 bg-white min-h-screen" },
    // 헤더
    React.createElement('div', { className: "mb-8" },
      React.createElement('div', { className: "flex items-center gap-3 mb-4" },
        React.createElement('div', { className: "bg-blue-600 p-2 rounded-lg" },
          React.createElement(Database, { className: "h-6 w-6 text-white" })
        ),
        React.createElement('div', null,
          React.createElement('h1', { className: "text-2xl font-bold text-gray-900" }, '노성 연동 FMS 시설물 관리시스템'),
          React.createElement('p', { className: "text-gray-600" }, '노성 CSV 데이터 연동 • 스마트 설비 검색 • 통합 관리')
        )
      ),
      // 데이터 로드 상태
      renderLoadStatus()
    ),
    
    // 검색 섹션
    React.createElement('div', { className: "space-y-6" },
      React.createElement('div', { className: "bg-gray-50 rounded-lg p-6" },
        React.createElement('h2', { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
          React.createElement(Search, { className: "h-5 w-5" }),
          '노성 설비 검색'
        ),
        React.createElement('div', { className: "flex gap-2" },
          React.createElement('input', {
            type: "text",
            placeholder: "설비코드, 설비명, 위치로 검색 (예: SC01, 수변전실, 지하1층)",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: handleKeyPress,
            className: "flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            disabled: isLoading || dataCount === 0
          }),
          React.createElement('button', {
            onClick: handleSearch,
            disabled: isLoading || dataCount === 0,
            className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          },
            React.createElement(Search, { className: "h-4 w-4" }),
            isLoading ? '검색중...' : '검색'
          )
        ),
        React.createElement('button', {
          onClick: loadCSVData,
          className: "mt-3 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 flex items-center gap-2"
        },
          React.createElement(Database, { className: "h-4 w-4" }),
          '데이터 새로고침'
        )
      ),
      
      // 검색 결과
      searchResults.length > 0 && React.createElement('div', null,
        React.createElement('h3', { className: "text-lg font-semibold mb-4 flex items-center gap-2" },
          React.createElement(Database, { className: "h-5 w-5" }),
          `검색 결과 (${searchResults.length}건)`
        ),
        React.createElement('div', { className: "space-y-4" },
          searchResults.map((item) =>
            React.createElement('div', { key: item.id, className: "bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow" },
              React.createElement('div', { className: "flex justify-between items-start" },
                React.createElement('div', { className: "flex-1" },
                  React.createElement('div', { className: "flex items-center gap-3 mb-3" },
                    getEquipmentIcon(item.code),
                    React.createElement('span', { className: "font-mono text-lg font-bold text-blue-600" }, item.code),
                    React.createElement('span', { className: "px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full" }, item.team),
                    item.status !== 'N/A' && React.createElement('span', { 
                      className: `px-2 py-1 text-xs rounded-full ${item.status === '정상' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`
                    }, item.status)
                  ),
                  React.createElement('h4', { className: "font-semibold text-gray-900 text-lg mb-2" }, item.name),
                  React.createElement('div', { className: "grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3" },
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Building, { className: "h-4 w-4" }),
                      React.createElement('span', null, '시설: ', item.facility)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(MapPin, { className: "h-4 w-4" }),
                      React.createElement('span', null, '위치: ', item.location)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Calendar, { className: "h-4 w-4" }),
                      React.createElement('span', null, '설치: ', item.installDate)
                    ),
                    React.createElement('div', { className: "flex items-center gap-2" },
                      React.createElement(Wrench, { className: "h-4 w-4" }),
                      React.createElement('span', null, '점검: ', item.checkCycle)
                    )
                  ),
                  React.createElement('div', { className: "text-sm text-gray-600" },
                    React.createElement('div', null, '규격: ', item.specs),
                    React.createElement('div', null, '내구연한: ', item.durability),
                    item.quantity !== 'N/A' && React.createElement('div', null, '수량: ', item.quantity),
                    item.manager !== 'N/A' && React.createElement('div', null, '담당자: ', item.manager),
                    item.notes && React.createElement('div', { className: "mt-2 p-2 bg-yellow-50 rounded text-yellow-800" }, '특이사항: ', item.notes)
                  )
                )
              )
            )
          )
        )
      ),
      
      // 검색 결과가 없을 때
      searchTerm && !isLoading && searchResults.length === 0 && dataCount > 0 && 
        React.createElement('div', { className: "text-center py-8 text-gray-500" },
          React.createElement('p', null, '검색 결과가 없습니다.'),
          React.createElement('p', { className: "text-sm mt-2" }, '다른 키워드로 검색해보세요.')
        )
    )
  );
};

// React 앱 렌더링
ReactDOM.render(React.createElement(FMSSystem), document.getElementById('root'));
