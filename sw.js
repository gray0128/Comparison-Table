self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('cache-name').then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/src/main.tsx',
          '/src/App.tsx',
          '/src/index.css',
          // 添加其他需要缓存的资源
        ]).then(() => {
          console.log('缓存资源成功');
        }).catch(error => {
          console.error('缓存资源失败：', error);
        });
      }).catch(error => {
        console.error('打开缓存失败：', error);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          console.log('从缓存中获取资源：', event.request.url);
          return response;
        } else {
          console.log('从网络中获取资源：', event.request.url);
          return fetch(event.request).then(response => {
            return caches.open('cache-name').then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
          });
        }
      }).catch(error => {
        console.error('获取资源失败：', error);
      })
    );
  });