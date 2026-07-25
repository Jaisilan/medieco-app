self.addEventListener('push', (event) => {
  let data = {
    title: 'Medieco',
    body: 'You have a new notification.',
    url: '/',
  }

  if (event.data) {
    data = event.data.json()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/favicon.png',
      data: {
        url: data.url || '/',
      },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.openWindow(url)
  )
})