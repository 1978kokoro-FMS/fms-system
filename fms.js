const { useState, useEffect } = React;
const { Search, Database, AlertTriangle, Eye, FileText, CheckCircle } = lucideReact;

let globalData = [];

const FMSSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [parseResults, setParseResults] = useState([]);
  const [selectedParser, setSelectedParser] = useState(-1);

  useEffect(() => {
    tryAllParsers();
  }, []);

  // 여러 파싱 방법을 시도
  const tryAllParsers = async () => {
    try {
      console.log('🚀 CSV 파일 로딩...');
      setLoadStatus('loading');
      
      const response = await fetch('./data.csv');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const csvText = await response.text();
      console.log('📄 파일 크기:', csvText.length);
      
      const parsers = [
        { name: '콤마 구분자 (,)', separator: ',', description: '일반적인 CSV 형식' },
        { name: '세미콜론 구분자 (;)', separator: ';', description: '유럽식 CSV 형식' },
        { name: '탭 구분자', separator: '\t', description: 'TSV 형식' },
        { name: '파이프 구분자 (|)', separator: '|', description: '파이프로 구분된 형식' }
      ];
      
      const results = [];
      
      for (let i = 0; i < parsers.length; i++) {
        const parser = parsers[i];
        try {
          const data = parseCSVWithSeparator(csvText, parser.separator);
          results.push({
            ...parser,
            success: true,
            dataCount: data.length,
            headers: data.length > 0 ? Object.keys(data[0]).slice(0, 5) : [],
            sampleData: data.slice(0, 3),
            fullData: data
          });
          console.log(`✅ ${parser.name}: ${data.length}개 데이터`);
        } catch (error) {
          results.push({
            ...parser,
            success: false,
            error: error.message,
            dataCount: 0
          });
          console.log(`❌ ${parser.name}: ${error.message}`);
        }
      }
      
      setParseResults(results);
      
      // 가장 많은 데이터를 파싱한 방법을 자동 선택
      const bestParser = results.reduce((best, current) => 
        current.dataCount > best.dataCount ? current : best
      );
      
      if (bestParser.dataCount > 0) {
        globalData = bestParser.fullData;
        setSelectedParser(results.indexOf(bestParser));
        setLoadStatus('success');
        console.log('🎯 최적 파서 선택:', bestParser.name, bestParser.dataCount + '개');
      } else {
        setLoadStatus('error');
      }
      
    } catch (error) {
      console.error('❌ 오류:', error);
      setLoadStatus('error');
    }
  };

  // 구분자별 CSV 파싱
  const parseCSVWithSeparator = (csvText, separator) => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length < 2) {
      throw new Error('데이터가 부족합니다');
    }
    
    // 헤더 파싱
    const headerLine = lines[0];
    const headers = headerLine.split(separator).map(h => h.replace(/^"|"$/g, '').trim());
    
    if (headers.length < 2) {
      throw new Error(`${separator} 구분자로 충분한 컬럼을 찾을 수 없습니다`);
    }
    
    // 데이터 파싱
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = line.split(separator).map(v => v.replace(/^"|"$/g, '').trim());
      
      if (values.length >= headers.length - 2) { // 약간의 여유
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // 최소한 하나의 필드에 의미있는 데이터가 있는지 확인
        if (Object.values(row).some(v => v && v.length > 0)) {
          data.push(row);
        }
      }
    }
    
    if (data.length === 0) {
      throw new Error('유효한 데이터 행이 없습니다');
    }
    
    return data;
  };

  // 파서 선택
  const selectParser = (index) => {
    const parser = parseResults[index];
    if (parser.success) {
      globalData = parser.fullData;
      setSelectedParser(index);
      console.log('📊 파서 선택:', parser.name, parser.dataCount + '개');
    }
  };

  // 검색
  const handleSearch = () => {
    if (!searchTerm.trim() || globalData.length === 0) {
      setSearchResults([]);
      return;
    }
    
    console.log('🔍 검색:', searchTerm, '대상:', globalData.length + '개');
    setIsLoading(true);
    
    try {
      const term = searchTerm.toLowerCase();
      const results = globalData.filter(row => {
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(term)
        );
      });
      
      const formatted = results.slice(0, 20).map((row, index) => {
        const values = Object.values(row);
        const keys = Object.keys(row);
        
        return {
          id: index,
          code: values[0] || `ID${index}`,
          name: values[1] || values[2] || '이름없음',
          info: values.slice(2, 6).filter(v => v).join(' | '),
          allData: Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('\n'),
          rawRow: row
        };
      });
      
      setSearchResults(formatted);
      console.log('✅ 검색 완료:', formatted.length + '개 결과');
      
    } catch (error) {
      console.error('❌ 검색 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return React.createElement('div', { className: "max-w-6xl mx-auto p-6 bg-white min-h-screen" },
    // 헤더
    React.createElement('div', { className: "mb-8" },
      React.createElement('h1', { className: "text-3xl font-bold mb-4 flex items-center gap-3" },
        React.createElement(Database, { className: "h-8 w-8 text-blue-600" }),
        '🔧 만능 CSV 파서 FMS 시스템'
      ),
      React.createElement('p', { className: "text-gray-600" }, 
        '모든 형태의 CSV를 자동 감지하고 파싱합니다'
      )
    ),

    // 파싱 결과
    parseResults.length > 0 && React.createElement('div', { className: "mb-8" },
      React.createElement('h2', { className: "text-xl font-bold mb-4" }, '📊 파싱 결과'),
      React.createElement('div', { className: "grid gap-4" },
        parseResults.map((result, index) =>
          React.createElement('div', { 
            key: index, 
            className: `border rounded-lg p-4 cursor-pointer transition-all ${
              selectedParser === index ? 'border-blue-500 bg-blue-50' : 
              result.success ? 'border-green-300 hover:border-green-500' : 'border-red-300'
            }`
          },
            React.createElement('div', { 
              className: "flex items-center justify-between",
              onClick: () => result.success && selectParser(index)
            },
              React.createElement('div', { className: "flex items-center gap-3" },
                result.success ? 
                  React.createElement(CheckCircle, { className: "h-5 w-5 text-green-600" }) :
                  React.createElement(AlertTriangle, { className: "h-5 w-5 text-red-600" }),
                React.createElement('div', null,
                  React.createElement('div', { className: "font-bold" }, result.name),
                  React.createElement('div', { className: "text-sm text-gray-600" }, result.description)
                )
              ),
              React.createElement('div', { className: "text-right" },
                result.success ? 
                  React.createElement('div', null,
                    React.createElement('div', { className: "font-bold text-green-600" }, 
                      result.dataCount + '개 데이터'
                    ),
                    selectedParser === index && 
                      React.createElement('div', { className: "text-xs text-blue-600" }, '✓ 선택됨')
                  ) :
                  React.createElement('div', { className: "text-red-600 text-sm" }, '실패')
              )
            ),
            result.success && result.headers && React.createElement('div', { className: "mt-3 pt-3 border-t" },
              React.createElement('div', { className: "text-sm text-gray-600" }, '컬럼: '),
              React.createElement('div', { className: "flex flex-wrap gap-1 mt-1" },
                result.headers.map((header, i) =>
                  React.createElement('span', { 
                    key: i, 
                    className: "px-2 py-1 bg-gray-100 text-xs rounded"
                  }, header)
                )
              )
            )
          )
        )
      )
    ),

    // 검색 섹션
    selectedParser >= 0 && React.createElement('div', { className: "mb-8" },
      React.createElement('div', { className: "bg-gray-50 rounded-lg p-6" },
        React.createElement('h2', { className: "text-xl font-bold mb-4 flex items-center gap-2" },
          React.createElement(Search, { className: "h-6 w-6" }),
          '🔍 데이터 검색'
        ),
        React.createElement('div', { className: "flex gap-3 mb-4" },
          React.createElement('input', {
            type: "text",
            placeholder: "모든 필드에서 검색합니다...",
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            onKeyPress: handleKeyPress,
            className: "flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500",
            disabled: isLoading
          }),
          React.createElement('button', {
            onClick: handleSearch,
            disabled: isLoading,
            className: "px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          }, isLoading ? '검색중...' : '검색')
        ),
        React.createElement('div', { className: "text-sm text-gray-600" },
          `총 ${globalData.length}개 데이터에서 검색 가능`
        )
      )
    ),

    // 검색 결과
    searchResults.length > 0 && React.createElement('div', null,
      React.createElement('h3', { className: "text-lg font-bold mb-4" },
        `📋 검색 결과 (${searchResults.length}건)`
      ),
      React.createElement('div', { className: "space-y-4" },
        searchResults.map(item =>
          React.createElement('div', { key: item.id, className: "border rounded-lg p-4 bg-white shadow-sm" },
            React.createElement('div', { className: "flex items-start gap-3" },
              React.createElement('div', { className: "w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center" },
                React.createElement(FileText, { className: "h-4 w-4 text-blue-600" })
              ),
              React.createElement('div', { className: "flex-1" },
                React.createElement('div', { className: "font-bold text-lg mb-1" }, item.code),
                React.createElement('div', { className: "text-gray-700 mb-2" }, item.name),
                React.createElement('div', { className: "text-sm text-gray-600 mb-3" }, item.info),
                React.createElement('details', { className: "text-xs" },
                  React.createElement('summary', { className: "cursor-pointer text-blue-600 hover:text-blue-800" }, 
                    '전체 데이터 보기'
                  ),
                  React.createElement('pre', { className: "mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto" },
                    item.allData
                  )
                )
              )
            )
          )
        )
      )
    ),

    // 검색 결과 없음
    searchTerm && !isLoading && searchResults.length === 0 && globalData.length > 0 &&
      React.createElement('div', { className: "text-center py-8 text-gray-500" },
        React.createElement('p', null, '검색 결과가 없습니다'),
        React.createElement('p', { className: "text-sm" }, '다른 키워드로 시도해보세요')
      )
  );
};

ReactDOM.render(React.createElement(FMSSystem), document.getElementById('root'));
